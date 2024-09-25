"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { FiSend, FiChevronLeft, FiChevronRight } from "react-icons/fi"; // Icons for sidebar and sending messages
import { FaRegComments } from "react-icons/fa"; // Icon for New Chat

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar open/close state
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    const userMessage: Message = { role: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data: Message = await response.json();
      setMessages((prevMessages) => [...prevMessages, data]);

      // Save chat session to localStorage
      const session = JSON.stringify([...messages, userMessage, data]);
      const newSessions = [...chatSessions, session];
      setChatSessions(newSessions);
      localStorage.setItem("chatSessions", JSON.stringify(newSessions));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a chat summary
  const getChatSummary = (session: string) => {
    const sessionData: Message[] = JSON.parse(session);
    return sessionData.length > 0 ? sessionData[0].content.slice(0, 30) + "..." : "No messages";
  };

  // Load chat sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem("chatSessions");
    if (savedSessions) {
      setChatSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Load chat session on click
  const loadChatSession = (session: string) => {
    const sessionData: Message[] = JSON.parse(session);
    setMessages(sessionData);
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Start a new chat
  const startNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-md py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">o1-Preview GPT</h1>
      </div>

      <div className="flex w-full max-w-5xl flex-1 relative">
        {/* Sidebar - Chat History */}
        <div
          className={`${
            isSidebarOpen ? "w-1/4" : "w-0"
          } transition-all bg-white shadow-lg p-4 space-y-4`}
        >
          {isSidebarOpen && (
            <>
              <button
                className="bg-blue-600 text-white flex items-center justify-center px-4 py-2 mt-10 rounded-md w-full"
                onClick={startNewChat}
              >
                <FaRegComments size={20} className="mr-2" /> New Chat
              </button>
              {chatSessions.length > 0 ? (
                chatSessions.map((session, index) => (
                  <div
                    key={index}
                    className="bg-gray-200 p-2 rounded-md text-sm cursor-pointer hover:bg-blue-100"
                    onClick={() => loadChatSession(session)}
                  >
                    <p>{getChatSummary(session)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No previous chats</p>
              )}
            </>
          )}
        </div>

        {/* Sidebar toggle button - placed inside the main container */}
        <button
          onClick={toggleSidebar}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full m-2 transition-all"
          style={{ height: "40px", width: "40px" }}
        >
          {isSidebarOpen ? <FiChevronLeft size={20} /> : <FiChevronRight size={20} />}
        </button>

        {/* Main content area */}
        <div className="flex-1 bg-white shadow-lg rounded-lg overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4" style={{ height: "60vh" }}>
            {messages.map((m, index) => (
              <div
                key={index}
                className={`flex mb-4 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${
                    m.role === "user"
                      ? "bg-gray-100 text-black rounded-bl-none"
                      : "bg-green-100 text-black rounded-bl-none"
                  }`}
                >
                  {m.role === "user" ? (
                    <span className="font-semibold text-blue-600">You: </span>
                  ) : (
                    <span className="font-semibold text-green-600">GPT: </span>
                  )}
                  <ReactMarkdown className="markdown-content">{m.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800">
                  <p>Loading...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <form onSubmit={handleSubmit} className="bg-gray-100 px-6 py-4">
            <div className="flex items-center">
              <input
                className="flex-grow px-4 py-2 mr-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Please enter a question..."
                disabled={isLoading}
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
                disabled={isLoading}
              >
                <FiSend size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
