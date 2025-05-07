**VintelliTour**

*This is a Next.js project bootstrapped with create-next-app.*

VintelliTour is a smart tourism platform integrating interactive maps, AI chatbots, and a flexible content management system.

Getting Started
1. Clone the repository

```
git clone https://github.com/minhloc289/VintelliTour
#
cd VintelliTour
```

2. Create a .env file
Add the following environment variables:

```
# MongoDB
MONGODB_URI=mongodb://localhost:27017/Vintellitour

# JWT Secret
JWT_SECRET="9#Jk32ndLs92sKsd9Afq2wEr_3kQMz7x1!mZg9ZfP48iQXmTk8d_0vWrzYd!HpT12"

# Public API Keys
NEXT_PUBLIC_MAPBOX_API_KEY=AIzaSyCTZzKDo5Ak7c6SvJS--9JDjOK5zD6gnLk
CESIUM_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0YjEwMDg5Ny00MjAwLTRhNGItOWE4YS0yZGQxYWRmYjJmYjYiLCJpZCI6Mjk1MTA0LCJpYXQiOjE3NDQ5NDE1OTN9.TCDhzZdw-Na15UT7S8C_coZr4kAhdld2uEVdvy_aGQ4

# LangGraph AI Agent
GOOGLE_API_KEY=AIzaSyA6e1-cG-QJPbIguZMYqv4TEKLzXsAEINo
TAVILY_API_KEY=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
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT="https://api.smith.langchain.com"
LANGSMITH_API_KEY="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"
LANGSMITH_PROJECT="VintelliTour"
ASSISTANT_ID=b9923bec-9652-45b1-a8e2-4cc547b1f03d

# Hugging Face (content moderation)
HUGGINGFACE_API_KEY=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
```

3. Install dependencies
```
npm install --legacy-peer-deps
npx @langchain/langgraph-cli@latest dev
```
4. Setup MongoDB
* Connect to your local MongoDB server.

* Create a new database named: Vintellitour.

5. Create and import collections
You need to create the following collections:

* users

* posts

* admins

* provinces

* locations

6. Import Data
   [Link](https://drive.google.com/drive/folders/1kjDJmBVAdah3ev-EwB4Hn8ht3O70l5Kn?usp=drive_link)
7. Run the development server
```
npm run dev
```




   
