import logging
import typing

from .handlers import Handler, SlackInstallationHandler
from .types import Event

logger = logging.getLogger(__name__)


class ChatopsEventsHandler:
    """
    ChatopsEventsHandler is a root handler which receives event from Chatops-Proxy and chooses the handler to process it.
    """

    HANDLERS: typing.List[typing.Type[Handler]] = [SlackInstallationHandler]

    def handle(self, event_data: Event):
        logger.info(f"msg=\"ChatopsEventsHandler: Handling\" event_type={event_data.get('event_type')}")
        for h in self.HANDLERS:
            if h.match(event_data):
                logger.info(
                    f"msg=\"ChatopsEventsHandler: Found matching handler {h.__name__}\" event_type={event_data.get('event_type')}"
                )
                h.handle(event_data.get("data", {}))
                break
