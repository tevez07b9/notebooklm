# 📄 Notebook LM

A **React + Node.js** web-based application that allows users to **upload and interact with PDF documents** through a chat interface. Users can ask questions to AI, and the system retrieves relevant answers along with page citations for easy navigation.

## ✨ Features

- 📂 **PDF Upload & Viewing**: Upload PDF files and chat about their contents.
- 💬 **AI-Powered Chat**: Ask questions and get answers based on the document's content.
- 🔍 **Citations with Clickable Navigation**: Extracted answers include citations that link directly to the relevant PDF pages.
- 🎨 **Modern UI**: Built using ShadCN UI and TailwindCSS for a sleek experience.

## 🚀 Tech Stack

### **Frontend**

- **React** (UI framework)
- **TypeScript** (for type safety)
- **Vite** (fast development server)
- **ShadCN UI** (for UI components)
- **TailwindCSS** (for styling)
- **React Router** (for navigation)

### **Backend**

- **Node.js** (runtime environment)
- **Express** (server framework)
- **SQLite** (database for storing PDF embeddings)
- **OpenAI API** (for answering questions)

## 🛠️ Installation & Setup

### **1. Clone the repository**

```sh
git clone https://github.com/tevez07b9/notebooklm.git
cd notebooklm
```

### **2. Install dependencies**

#### **Frontend**

```sh
npm install
```

#### **Backend**

```sh
cd backend
npm install
```

### **3. Set up environment variables**

Create a `.env` file in the `/` directory and add the following:

```env
VITE_API_URL=your-backend-url
```

Create a `.env` file in the `backend/` directory and add the following:

```env
OPENAI_API_KEY=your-openai-key
```

### **4. Run the application**

#### **Start the backend**

```sh
cd backend
npm run dev
```

#### **Start the frontend**

```sh
npm run dev
```

### **5. Open the app**

Go to: [http://localhost:5173](http://localhost:5173) 🚀

## 📜 License

This project is licensed under the [MIT License](LICENSE).
