from langchain.chains import LLMCheckerChain

from langflow_base.interface.custom.custom_component import CustomComponent

from langflow_base.field_typing import BaseLanguageModel, Text


class LLMCheckerChainComponent(CustomComponent):
    display_name = "LLMCheckerChain"
    description = ""
    documentation = "https://python.langchain.com/docs/modules/chains/additional/llm_checker"

    def build_config(self):
        return {
            "llm": {"display_name": "LLM"},
        }

    def build(
        self,
        input_value: Text,
        llm: BaseLanguageModel,
    ) -> Text:
        chain = LLMCheckerChain.from_llm(llm=llm)
        response = chain.invoke({chain.input_key: input_value})
        result = response.get(chain.output_key, "")
        result_str = Text(result)
        self.status = result_str
        return result_str