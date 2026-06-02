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

	"gitee.com/MM-Q/fastlog"
	"psm/internal/service"
)

// AIHandler 处理 AI 相关方法，嵌入到 App 结构体
type AIHandler struct {
	ctx         context.Context
	settingsSvc *service.SettingsService
	cancelFunc  context.CancelFunc
	mu          sync.Mutex
	logger      *fastlog.Logger
}

// Init 初始化 AIHandler
func (h *AIHandler) Init(ctx context.Context, settingsSvc *service.SettingsService, logger *fastlog.Logger) {
	h.ctx = ctx
	h.settingsSvc = settingsSvc
	h.logger = logger
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
	h.logger.Infow("AI 生成提示词请求", fastlog.String("description", description))
	prompt, err := h.getSystemPrompt("ai_generate_prompt")
	if err != nil || prompt == "" {
		h.logger.Warnw("未配置生成系统提示词", fastlog.String("key", "ai_generate_prompt"))
		return fmt.Errorf("未配置生成系统提示词，请在设置页配置")
	}
	return h.streamChat(prompt, description)
}

// OptimizePrompt 向 AI API 发起流式请求，优化已有的提示词内容
func (h *AIHandler) OptimizePrompt(content string) error {
	h.logger.Infow("AI 优化提示词请求", fastlog.String("content", content))
	prompt, err := h.getSystemPrompt("ai_optimize_prompt")
	if err != nil || prompt == "" {
		h.logger.Warnw("未配置优化系统提示词", fastlog.String("key", "ai_optimize_prompt"))
		return fmt.Errorf("未配置优化系统提示词，请在设置页配置")
	}
	return h.streamChat(prompt, content)
}

// OptimizeName 向 AI API 发起流式请求，优化名称
func (h *AIHandler) OptimizeName(content string) error {
	h.logger.Infow("AI 优化名称请求", fastlog.String("content", content))
	prompt, err := h.getSystemPrompt("ai_optimize_name")
	if err != nil || prompt == "" {
		h.logger.Warnw("未配置名称优化系统提示词", fastlog.String("key", "ai_optimize_name"))
		return fmt.Errorf("未配置名称优化系统提示词，请在设置页配置")
	}
	return h.streamChat(prompt, content)
}

// OptimizeDescription 向 AI API 发起流式请求，优化描述
func (h *AIHandler) OptimizeDescription(content string) error {
	h.logger.Infow("AI 优化描述请求", fastlog.String("content", content))
	prompt, err := h.getSystemPrompt("ai_optimize_description")
	if err != nil || prompt == "" {
		h.logger.Warnw("未配置描述优化系统提示词", fastlog.String("key", "ai_optimize_description"))
		return fmt.Errorf("未配置描述优化系统提示词，请在设置页配置")
	}
	return h.streamChat(prompt, content)
}

// GenerateNameFromContent 根据提示词内容流式生成名称
func (h *AIHandler) GenerateNameFromContent(content string) error {
	h.logger.Infow("AI GenerateNameFromContent 被调用", fastlog.Int("content_len", len(content)))
	prompt, err := h.getSystemPrompt("ai_generate_name_prompt")
	if err != nil {
		h.logger.Errorw("读取生成名称系统提示词失败", fastlog.Error(err))
		return fmt.Errorf("未配置生成名称系统提示词，请在设置页配置")
	}
	if prompt == "" {
		h.logger.Warnw("生成名称系统提示词为空")
		return fmt.Errorf("生成名称系统提示词为空，请在设置页配置并填写内容")
	}
	h.logger.Infow("开始调用 streamChat 生成名称", fastlog.Int("prompt_len", len(prompt)))
	err = h.streamChat(prompt, content)
	h.logger.Infow("streamChat 生成名称返回", fastlog.Error(err))
	return err
}

// GenerateDescriptionFromContent 根据内容流式生成描述
func (h *AIHandler) GenerateDescriptionFromContent(content string) error {
	h.logger.Infow("AI GenerateDescriptionFromContent 被调用", fastlog.Int("content_len", len(content)))
	prompt, err := h.getSystemPrompt("ai_generate_desc_prompt")
	if err != nil {
		h.logger.Errorw("读取生成描述系统提示词失败", fastlog.Error(err))
		return fmt.Errorf("未配置生成描述系统提示词，请在设置页配置")
	}
	if prompt == "" {
		h.logger.Warnw("生成描述系统提示词为空")
		return fmt.Errorf("生成描述系统提示词为空，请在设置页配置并填写内容")
	}
	h.logger.Infow("开始调用 streamChat 生成描述", fastlog.Int("prompt_len", len(prompt)))
	err = h.streamChat(prompt, content)
	h.logger.Infow("streamChat 生成描述返回", fastlog.Error(err))
	return err
}

// TranslateContent 流式翻译内容到目标语言
func (h *AIHandler) TranslateContent(content, targetLang string) error {
	h.logger.Infow("AI 翻译请求", fastlog.String("target_lang", targetLang))
	prompt, err := h.getSystemPrompt("ai_translate_prompt")
	if err != nil || prompt == "" {
		h.logger.Warnw("未配置翻译系统提示词", fastlog.String("key", "ai_translate_prompt"))
		return fmt.Errorf("未配置翻译系统提示词")
	}
	userMsg := fmt.Sprintf("请将以下内容翻译成%s：\n\n%s", targetLang, content)
	return h.streamChat(prompt, userMsg)
}

// getSystemPrompt 从 settings 读取系统提示词
func (h *AIHandler) getSystemPrompt(key string) (string, error) {
	return h.settingsSvc.GetSetting(key)
}

// streamChat 通用流式聊天方法，接收 system prompt 和 user message，通过 Events 推送 token
func (h *AIHandler) streamChat(systemMsg, userMsg string) error {
	apiURL, err := h.settingsSvc.GetSetting("ai_api_url")
	if err != nil || apiURL == "" {
		h.logger.Warnw("未配置 AI API 地址", fastlog.String("key", "ai_api_url"))
		return fmt.Errorf("未配置 AI API 地址，请在设置页配置")
	}

	apiKey, err := h.settingsSvc.GetSetting("ai_api_key")
	if err != nil || apiKey == "" {
		h.logger.Warnw("未配置 AI API Key", fastlog.String("key", "ai_api_key"))
		return fmt.Errorf("未配置 AI API Key，请在设置页配置")
	}

	model, err := h.settingsSvc.GetSetting("ai_model")
	if err != nil || model == "" {
		model = "gpt-4o-mini"
	}

	chatURL := buildChatURL(apiURL)

	h.logger.Infow("streamChat 发起请求", fastlog.String("url", chatURL), fastlog.String("model", model))

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
			h.logger.Infow("streamChat 请求被取消")
			return nil
		}
		h.logger.Errorw("发送 AI 请求失败", fastlog.Error(err))
		return fmt.Errorf("请求 AI API 失败: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	h.logger.Infow("streamChat 收到响应", fastlog.Int("status_code", resp.StatusCode))

	if resp.StatusCode != http.StatusOK {
		h.logger.Errorw("AI API 请求失败", fastlog.Int("status_code", resp.StatusCode))
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

	h.logger.Infow("streamChat SSE 循环结束", fastlog.Error(scanner.Err()))
	runtime.EventsEmit(h.ctx, "ai:done", "")
	h.logger.Infow("streamChat 已发送 ai:done 事件")
	return nil
}

// CancelAIGeneration 取消正在进行的 AI 生成请求
func (h *AIHandler) CancelAIGeneration() {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.cancelFunc != nil {
		h.logger.Infow("取消 AI 生成请求")
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
	h.logger.Infow("获取 AI 模型列表")

	apiURL, err := h.settingsSvc.GetSetting("ai_api_url")
	if err != nil || apiURL == "" {
		h.logger.Warnw("未配置 AI API 地址", fastlog.String("key", "ai_api_url"))
		return nil, fmt.Errorf("未配置 AI API 地址，请在设置页配置")
	}

	apiKey, err := h.settingsSvc.GetSetting("ai_api_key")
	if err != nil || apiKey == "" {
		h.logger.Warnw("未配置 AI API Key", fastlog.String("key", "ai_api_key"))
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
		h.logger.Errorw("获取模型列表失败", fastlog.Int("status", resp.StatusCode))
		return nil, fmt.Errorf("获取模型列表失败 (HTTP %d)", resp.StatusCode)
	}

	var result modelsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		h.logger.Errorw("解析模型列表失败", fastlog.Error(err))
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
	h.logger.Infow("测试 AI 连接", fastlog.String("api_url", apiURL))

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
		h.logger.Errorw("测试 AI 连接失败", fastlog.String("api_url", apiURL), fastlog.Error(err))
		return "", fmt.Errorf("连接失败: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode == http.StatusOK {
		return "连接成功", nil
	}

	h.logger.Errorw("测试 AI 连接返回非 200", fastlog.Int("status", resp.StatusCode))
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
