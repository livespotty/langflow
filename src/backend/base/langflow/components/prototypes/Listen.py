from langflow.custom import CustomComponent
from langflow.schema import Data


class ListenComponent(CustomComponent):
    display_name = "Listen"
    description = "A component to listen for a notification."
    name = "Listen"
    beta: bool = True

    def build_config(self):
        return {
            "name": {
                "display_name": "Name",
                "info": "The name of the notification to listen for.",
            },
        }

    def build(self, name: str) -> Data:
        state = self.get_state(name)
        self._set_successors_ids()
        self.status = state
        return state

    def _set_successors_ids(self):
        self.vertex.is_state = True
        successors = self.vertex.graph.successor_map.get(self.vertex.id, [])
        return successors + self.vertex.graph.activated_vertices
