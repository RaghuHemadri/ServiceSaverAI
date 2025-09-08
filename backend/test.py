# Download the helper library from https://www.twilio.com/docs/python/install
import os
from twilio.rest import Client

# TWILIO_ACCOUNT_SID="ACe724c54a311c49d5002391048966d38e"
# TWILIO_AUTH_TOKEN="e87e60d26113f19811835adaed752ac8"

# Find your Account SID and Auth Token at twilio.com/console
# and set the environment variables. See http://twil.io/secure
account_sid = TWILIO_ACCOUNT_SID
auth_token = TWILIO_AUTH_TOKEN
client = Client(account_sid, auth_token)

call = client.calls.create(
    twiml="<Response><Say>Ahoy, World!</Say></Response>",
    to="+1 551 362 7996",
    from_="+1 775 416 7585",
)

print(call.sid)