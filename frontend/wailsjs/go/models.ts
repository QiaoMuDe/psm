export namespace db {
	
	export class ImportResult {
	    success: number;
	    skipped: number;
	    failed: number;
	    errors: string[];
	
	    static createFrom(source: any = {}) {
	        return new ImportResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.skipped = source["skipped"];
	        this.failed = source["failed"];
	        this.errors = source["errors"];
	    }
	}
	export class Prompt {
	    id: number;
	    name: string;
	    content: string;
	    category: string;
	    tags: string;
	    is_pinned: boolean;
	    is_template: boolean;
	    created_at: string;
	    updated_at: string;
	
	    static createFrom(source: any = {}) {
	        return new Prompt(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.content = source["content"];
	        this.category = source["category"];
	        this.tags = source["tags"];
	        this.is_pinned = source["is_pinned"];
	        this.is_template = source["is_template"];
	        this.created_at = source["created_at"];
	        this.updated_at = source["updated_at"];
	    }
	}
	export class Skill {
	    id: number;
	    name: string;
	    description: string;
	    relative_path: string;
	    is_pinned: boolean;
	    created_at: string;
	    updated_at: string;
	
	    static createFrom(source: any = {}) {
	        return new Skill(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.relative_path = source["relative_path"];
	        this.is_pinned = source["is_pinned"];
	        this.created_at = source["created_at"];
	        this.updated_at = source["updated_at"];
	    }
	}
	export class SkillFile {
	    name: string;
	    is_dir: boolean;
	    size: number;
	    mod_time: string;
	
	    static createFrom(source: any = {}) {
	        return new SkillFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.is_dir = source["is_dir"];
	        this.size = source["size"];
	        this.mod_time = source["mod_time"];
	    }
	}

}

export namespace handler {
	
	export class DataStats {
	    prompt_count: number;
	    skill_count: number;
	    db_size: number;
	
	    static createFrom(source: any = {}) {
	        return new DataStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.prompt_count = source["prompt_count"];
	        this.skill_count = source["skill_count"];
	        this.db_size = source["db_size"];
	    }
	}

}

export namespace utils {
	
	export class BackupRestoreResult {
	    prompts_restored: number;
	    skills_restored: number;
	    prompts_skipped: number;
	    skills_skipped: number;
	
	    static createFrom(source: any = {}) {
	        return new BackupRestoreResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.prompts_restored = source["prompts_restored"];
	        this.skills_restored = source["skills_restored"];
	        this.prompts_skipped = source["prompts_skipped"];
	        this.skills_skipped = source["skills_skipped"];
	    }
	}

}

