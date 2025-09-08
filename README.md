### Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

#### Step 1: Install Dependencies

```bash
# using npm
npm install
```

#### Step 2: Start Webpack

Let Webpack bundle your react native project so that it can serve it for web.

```bash
# using npm
npm run web
```

## Backend Setup Instructions

This guide will help you set up the backend server for the voice assistant application.

### Prerequisites

- Ensure you have Python 3.8+ installed on your machine.
- You need an account with Twilio and a verified phone number. You can verify your number in the [Twilio Console](https://console.twilio.com/us1/develop/phone-numbers/manage/verified).
- **Firebase Setup**: Create a Firebase project and download the `firebase_Adminsdk.json` file.

### Setup Steps

1. **Run ngrok**

   To expose your local server to the internet, you'll need to run ngrok. Open a terminal and execute the following command:

   ```bash
   ngrok http 8000
   ```

   Copy the `Forwarding` URL provided by ngrok. It will look something like `https://[your-ngrok-subdomain].ngrok.app`.

2. **Update the .env File**

   Update a `.env` file in the root of your project directory with credentials, use the above ngrok URL for the server.

3. **Install Dependencies**

   In the terminal, navigate to your project directory and run:

   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Server**

   Start the server by executing:

   ```bash
   python app.py
   ```

### Notes

- Ensure the phone number you are calling is verified in the Twilio Console if you are in trial mode.
- If you encounter any issues, check the logs for error messages and verify your environment variables are set correctly.
