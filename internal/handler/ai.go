package handler

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"psm/internal/service"
)

// AIHandler 处理 AI 相关方法，嵌入到 App 结构体
type AIHandler struct {
	ctx         context.Context
	settingsSvc *service.SettingsService
	cancelFunc  context.CancelFunc
	mu          sync.Mutex
}

// Init 初始化 AIHandler
func (h *AIHandler) Init(ctx context.Context, settingsSvc *service.SettingsService) {
	h.ctx = ctx
	h.settingsSvc = settingsSvc
}

// chatRequest 表示 OpenAI 兼容的 chat completions 请求体
type chatRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
	Stream   bool          `json:"stream"`
}

// chatMessage 表示聊天消息
type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// streamChunk 表示 SSE 流式响应中的单个 chunk
type streamChunk struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
	} `json:"choices"`
}

// GeneratePrompt 向 AI API 发起流式请求，通过 Wails Events 逐 token 推送生成内容
func (h *AIHandler) GeneratePrompt(description string) error {
	prompt, err := h.getSystemPrompt("ai_generate_prompt")
	if err != nil || prompt == "" {
		return fmt.Errorf("未配置生成系统提示词，请在设置页配置")
	}
	return h.streamChat(prompt, description)
}

// OptimizePrompt 向 AI API 发起流式请求，优化已有的提示词内容
func (h *AIHandler) OptimizePrompt(content string) error {
	prompt, err := h.getSystemPrompt("ai_optimize_prompt")
	if err != nil || prompt == "" {
		return fmt.Errorf("未配置优化系统提示词，请在设置页配置")
	}
	return h.streamChat(prompt, content)
}

// getSystemPrompt 从 settings 读取系统提示词
func (h *AIHandler) getSystemPrompt(key string) (string, error) {
	return h.settingsSvc.GetSetting(key)
}

// streamChat 通用流式聊天方法，接收 system prompt 和 user message，通过 Events 推送 token
func (h *AIHandler) streamChat(systemMsg, userMsg string) error {
	apiURL, err := h.settingsSvc.GetSetting("ai_api_url")
	if err != nil || apiURL == "" {
		return fmt.Errorf("未配置 AI API 地址，请在设置页配置")
	}

	apiKey, err := h.settingsSvc.GetSetting("ai_api_key")
	if err != nil || apiKey == "" {
		return fmt.Errorf("未配置 AI API Key，请在设置页配置")
	}

	model, err := h.settingsSvc.GetSetting("ai_model")
	if err != nil || model == "" {
		model = "gpt-4o-mini"
	}

	chatURL := buildChatURL(apiURL)

	reqBody := chatRequest{
		Model:  model,
		Stream: true,
		Messages: []chatMessage{
			{Role: "system", Content: systemMsg},
			{Role: "user", Content: userMsg},
		},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("构建请求体失败: %w", err)
	}

	req, err := http.NewRequestWithContext(h.ctx, "POST", chatURL, strings.NewReader(string(bodyBytes)))
	if err != nil {
		return fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	ctx, cancel := context.WithCancel(h.ctx)
	h.mu.Lock()
	h.cancelFunc = cancel
	h.mu.Unlock()

	defer func() {
		h.mu.Lock()
		h.cancelFunc = nil
		h.mu.Unlock()
	}()

	req = req.WithContext(ctx)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		if ctx.Err() == context.Canceled {
			return nil
		}
		return fmt.Errorf("请求 AI API 失败: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		errBody, _ := bufio.NewReader(resp.Body).ReadString('\n')
		errMsg := fmt.Sprintf("AI API 返回错误 (HTTP %d)", resp.StatusCode)
		if errBody != "" {
			errMsg += ": " + strings.TrimSpace(errBody)
		}
		runtime.EventsEmit(h.ctx, "ai:error", errMsg)
		return nil
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		if ctx.Err() != nil {
			return nil
		}

		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}

		data := strings.TrimPrefix(line, "data: ")
		if data == "[DONE]" {
			break
		}

		var chunk streamChunk
		if err := json.Unmarshal([]byte(data), &chunk); err != nil {
			continue
		}

		if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
			runtime.EventsEmit(h.ctx, "ai:token", chunk.Choices[0].Delta.Content)
		}
	}

	runtime.EventsEmit(h.ctx, "ai:done", "")
	return nil
}

// CancelAIGeneration 取消正在进行的 AI 生成请求
func (h *AIHandler) CancelAIGeneration() {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.cancelFunc != nil {
		h.cancelFunc()
		h.cancelFunc = nil
	}
}

// modelsResponse 表示 OpenAI 兼容 /v1/models 接口的响应结构
type modelsResponse struct {
	Data []struct {
		ID string `json:"id"`
	} `json:"data"`
}

// GetAIModels 从 AI API 获取可用模型列表
func (h *AIHandler) GetAIModels() ([]string, error) {
	apiURL, err := h.settingsSvc.GetSetting("ai_api_url")
	if err != nil || apiURL == "" {
		return nil, fmt.Errorf("未配置 AI API 地址，请在设置页配置")
	}

	apiKey, err := h.settingsSvc.GetSetting("ai_api_key")
	if err != nil || apiKey == "" {
		return nil, fmt.Errorf("未配置 AI API Key，请在设置页配置")
	}

	modelsURL := buildModelsURL(apiURL)

	req, err := http.NewRequestWithContext(h.ctx, "GET", modelsURL, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求模型列表失败: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("获取模型列表失败 (HTTP %d)", resp.StatusCode)
	}

	var result modelsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("解析模型列表失败: %w", err)
	}

	models := make([]string, 0, len(result.Data))
	for _, m := range result.Data {
		if m.ID != "" {
			models = append(models, m.ID)
		}
	}

	return models, nil
}

// TestAIConnection 测试 AI API 连接是否可用
func (h *AIHandler) TestAIConnection(apiURL, apiKey string) (string, error) {
	if apiURL == "" {
		return "", fmt.Errorf("请输入 API 地址")
	}

	modelsURL := buildModelsURL(apiURL)

	req, err := http.NewRequestWithContext(h.ctx, "GET", modelsURL, nil)
	if err != nil {
		return "", fmt.Errorf("创建请求失败: %w", err)
	}

	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("连接失败: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode == http.StatusOK {
		return "连接成功", nil
	}

	return "", fmt.Errorf("连接失败 (HTTP %d)", resp.StatusCode)
}

// buildChatURL 根据基础路径拼接 /chat/completions 端点
func buildChatURL(baseURL string) string {
	return strings.TrimRight(baseURL, "/") + "/chat/completions"
}

// buildModelsURL 根据基础路径拼接 /models 端点
func buildModelsURL(baseURL string) string {
	return strings.TrimRight(baseURL, "/") + "/models"
}
