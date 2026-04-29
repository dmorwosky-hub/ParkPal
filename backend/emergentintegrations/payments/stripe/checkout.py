import stripe
from pydantic import BaseModel
from typing import Optional, Dict, Any


class CheckoutSessionRequest(BaseModel):
    amount: float
    currency: str = "usd"
    success_url: str
    cancel_url: str
    metadata: Optional[Dict[str, Any]] = None


class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str


class WebhookResponse(BaseModel):
    payment_status: str
    session_id: str
    status: str


class CheckoutStatusResponse(BaseModel):
    payment_status: str
    status: str


class StripeCheckout:
    def __init__(self, api_key: str, webhook_url: str = None):
        self.api_key = api_key
        self.webhook_url = webhook_url
        if api_key:
            stripe.api_key = api_key

    async def create_checkout_session(self, request: CheckoutSessionRequest) -> CheckoutSessionResponse:
        amount_cents = int(request.amount * 100)
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": request.currency,
                    "product_data": {"name": "Parking Spot Booking"},
                    "unit_amount": amount_cents,
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata=request.metadata or {},
        )
        return CheckoutSessionResponse(session_id=session.id, url=session.url)

    async def get_checkout_status(self, session_id: str) -> CheckoutStatusResponse:
        session = stripe.checkout.Session.retrieve(session_id)
        return CheckoutStatusResponse(
            payment_status=session.payment_status,
            status=session.status,
        )

    async def handle_webhook(self, body: bytes, signature: str) -> WebhookResponse:
        import os
        webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
        if webhook_secret:
            event = stripe.Webhook.construct_event(body, signature, webhook_secret)
        else:
            import json
            event = stripe.Event.construct_from(json.loads(body), stripe.api_key)

        payment_status = "unpaid"
        session_id = ""
        status = event.get("type", "")

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            session_id = session["id"]
            payment_status = session.get("payment_status", "unpaid")
            status = session.get("status", "")

        return WebhookResponse(
            payment_status=payment_status,
            session_id=session_id,
            status=status,
        )
