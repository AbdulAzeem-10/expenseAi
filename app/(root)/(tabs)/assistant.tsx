import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_PROMPTS = [
  "How much did I spend on food this month?",
  "What's my biggest expense this week?",
  "Am I over budget anywhere?",
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hi! Ask me anything about your spending or budgets in the last 30 days.",
  },
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <View
      style={{
        marginBottom: 12,
        maxWidth: "85%",
        alignSelf: isUser ? "flex-end" : "flex-start",
      }}
    >
      <View
        style={{
          backgroundColor: isUser ? "#1A1D26" : "#FFFFFF",
          borderWidth: isUser ? 0 : 1,
          borderColor: "#E8E6DF",
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: isUser ? "#FFFFFF" : "#1A1D26",
          }}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}

export default function AssistantScreen() {
  const [messages, setMessages] =
    useState<ChatMessage[]>(INITIAL_MESSAGES);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setSending(true);

    // Temporary fake response.
    // Replace this later with your actual API call.
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "This is a temporary assistant response. Connect your backend or AI service here.",
      };

      setMessages((previous) => [...previous, assistantMessage]);
      setSending(false);
    }, 1000);
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F5F4F0",
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <Text
          style={{
            color: "#1A1D26",
            fontSize: 20,
            fontWeight: "600",
          }}
        >
          Assistant
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} />
          )}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 12,
          }}
          ListFooterComponent={
            sending ? (
              <View
                style={{
                  alignSelf: "flex-start",
                  marginBottom: 12,
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#E8E6DF",
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <ActivityIndicator size="small" color="#4A9EFF" />
              </View>
            ) : null
          }
        />

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <View
            style={{
              paddingHorizontal: 20,
              paddingBottom: 8,
              gap: 8,
            }}
          >
            {SUGGESTED_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt}
                onPress={() => sendMessage(prompt)}
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#E8E6DF",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={{
                    color: "#5C5F68",
                    fontSize: 12,
                  }}
                >
                  {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 20,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your money..."
            placeholderTextColor="#8A8D96"
            editable={!sending}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E8E6DF",
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 14,
              color: "#1A1D26",
            }}
          />

          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={sending}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "#1A1D26",
              alignItems: "center",
              justifyContent: "center",
              opacity: sending ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: "600",
              }}
            >
              ↑
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}