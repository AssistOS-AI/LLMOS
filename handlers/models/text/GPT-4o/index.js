import  ITextLLM from "../../../interfaces/ITextLLM.js";

class GPT4o extends ITextLLM {
    static modelName = "gpt-4o-2024-05-13";
    constructor(APIKey,config) {
        super(APIKey,config);
    }
    getModelName() {
        return GPT4o.modelName;
    }

}

export default GPT4o;
