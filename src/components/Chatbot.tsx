import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ThumbsUp, ThumbsDown, Copy, Check, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import profileImage from "@/assets/profile-fatma.jpg";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  liked?: boolean;
}

// Detect language of user message
const detectMessageLanguage = (text: string): string => {
  const arabicPattern = /[\u0600-\u06FF]/;
  const lowerText = text.toLowerCase().trim().replace(/[!.?،؟]/g, '');
  
  if (arabicPattern.test(text)) return 'arabic';
  
  const englishWords = ['hello', 'hi', 'hey', 'good morning', 'good evening'];
  const frenchWords = ['bonjour', 'salut', 'bonsoir', 'bjr', 'slt', 'coucou', 'cc', 'bsr'];
  
  if (englishWords.some(w => lowerText.includes(w))) return 'english';
  if (frenchWords.some(w => lowerText.includes(w))) return 'french';
  
  return 'french'; // default
};

// Get greeting in detected language
const getGreeting = (lang: string): string => {
  const greetings = {
    french: "👋 Bonjour! Je suis l'assistant virtuel de Fatma. Comment puis-je vous aider à en savoir plus sur son parcours 🎓, ses compétences 💻 ou ses projets 🚀?",
    english: "👋 Hello! I'm Fatma's virtual assistant. How can I help you learn more about her background 🎓, skills 💻, or projects 🚀?",
    arabic: "👋 مرحباً! أنا المساعد الافتراضي لفاطمة. كيف يمكنني مساعدتك لمعرفة المزيد عن مسيرتها 🎓 ومهاراتها 💻 ومشاريعها 🚀؟"
  };
  return greetings[lang] || greetings.french;
};

// Function to clean message text
const formatMessageWithLinks = (text: string) => {
  const cleanText = text
    .replace(/📧\s*(Plus d'infos?|Contact disponible|Pour plus d'informations?|Contact|Info):?\s*/gi, '')
    .replace(/ci-dessous\.?/gi, '')
    .replace(/fatmaabchouk18@gmail\.com/gi, '')
    .replace(/linkedin\.com\/in\/fatma-abchouk-b49753253/gi, '')
    .replace(/github\.com\/Fatmaabchouk/gi, '')
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/\|\s*/g, '')
    .replace(/•\s*/g, '')
    .trim()
    .replace(/\s+/g, ' ');
  
  return <span>{cleanText}</span>;
};

// Check if message contains contact info
const hasContactInfo = (text: string) => {
  return text.includes('📧') && 
         !text.toLowerCase().includes('hello') && 
         !text.toLowerCase().includes('bonjour') &&
         !text.includes('مرحبا');
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hello! I'm Fatma's virtual assistant. How can I help you learn more about her background 🎓, skills 💻, or projects 🚀?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState<string>("smileys");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Comprehensive emoji categories
  const emojiCategories = {
    smileys: {
      icon: "😊",
      emojis: [
        "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
        "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
        "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
        "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐",
        "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬",
        "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒",
        "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "😵", "🤯",
        "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕", "😟"
      ]
    },
    gestures: {
      icon: "👋",
      emojis: [
        "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏",
        "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆",
        "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛",
        "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️",
        "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂"
      ]
    },
    people: {
      icon: "👤",
      emojis: [
        "👶", "👧", "🧒", "👦", "👩", "🧑", "👨", "👩‍🦱",
        "🧑‍🦱", "👨‍🦱", "👩‍🦰", "🧑‍🦰", "👨‍🦰", "👱‍♀️", "👱", "👱‍♂️",
        "👩‍🦳", "🧑‍🦳", "👨‍🦳", "👩‍🦲", "🧑‍🦲", "👨‍🦲", "🧔", "👵",
        "🧓", "👴", "👲", "👳‍♀️", "👳", "👳‍♂️", "🧕", "👮‍♀️",
        "👮", "👮‍♂️", "👷‍♀️", "👷", "👷‍♂️", "💂‍♀️", "💂", "💂‍♂️"
      ]
    },
    animals: {
      icon: "🐶",
      emojis: [
        "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
        "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵",
        "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤",
        "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗",
        "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜"
      ]
    },
    food: {
      icon: "🍔",
      emojis: [
        "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇",
        "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥",
        "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️",
        "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠",
        "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳"
      ]
    },
    activities: {
      icon: "⚽",
      emojis: [
        "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉",
        "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍",
        "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿",
        "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌",
        "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "⛹️"
      ]
    },
    travel: {
      icon: "✈️",
      emojis: [
        "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑",
        "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🦯", "🦽",
        "🦼", "🛴", "🚲", "🛵", "🏍️", "🛺", "🚨", "🚔",
        "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋",
        "🚞", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "✈️"
      ]
    },
    objects: {
      icon: "💡",
      emojis: [
        "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️",
        "🖲️", "🕹️", "🗜️", "💾", "💿", "📀", "📼", "📷",
        "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟",
        "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️",
        "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡", "🔋", "💡"
      ]
    },
    symbols: {
      icon: "❤️",
      emojis: [
        "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
        "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
        "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️",
        "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈",
        "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐"
      ]
    }
  };

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      setTimeout(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }, 100);
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setShowEmojiPicker(false); // Close emoji picker when sending
    
    // Handle greetings on client side WITH LANGUAGE DETECTION
    const greetings = [
      'hello', 'hi', 'hey', 'good morning', 'good evening',
      'bonjour', 'salut', 'bonsoir', 'bjr', 'bnj', 'slm', 'salam', 
      'bsr', 'cc', 'coucou', 'slt',
      'مرحبا', 'مرحباً', 'السلام', 'أهلا', 'أهلاً', 'سلام', 'اهلا'
    ];
    const normalizedMessage = userMessage.toLowerCase().trim().replace(/[!.?،؟]/g, '');
    const isGreeting = greetings.includes(normalizedMessage);
    
    setMessages(prev => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);
    
    if (isGreeting) {
      // Detect language and return appropriate greeting
      const detectedLang = detectMessageLanguage(userMessage);
      const greeting = getGreeting(detectedLang);
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: greeting,
        timestamp: new Date()
      }]);
      return;
    }
    
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { message: userMessage }
      });

      if (error) throw error;

      if (data?.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply, timestamp: new Date() }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "❌ Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive"
      });
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "😅 Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = (index: number, isLike: boolean) => {
    setMessages(prev => prev.map((msg, i) => {
      if (i === index) {
        return { ...msg, liked: msg.liked === isLike ? undefined : isLike };
      }
      return msg;
    }));
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "✅ Copié!",
        description: "Le message a été copié dans le presse-papiers."
      });
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de copier le message.",
        variant: "destructive"
      });
    }
  };

  const addEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110 z-50 ${
          isOpen ? "hidden" : "flex"
        }`}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-background border rounded-lg shadow-xl flex flex-col z-50 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Assistant Fatma</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary/90"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 p-4 overflow-y-auto"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                      <AvatarImage src={profileImage} alt="Fatma" />
                      <AvatarFallback>FA</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.role === "assistant" 
                          ? formatMessageWithLinks(message.content)
                          : message.content
                        }
                      </p>
                      
                      {/* Contact buttons for assistant messages */}
                      {message.role === "assistant" && hasContactInfo(message.content) && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t">
                          <a
                            href="mailto:fatmaabchouk18@gmail.com"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-xs font-medium transition-all hover:scale-105 shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Email
                          </a>
                          <a
                            href="https://www.linkedin.com/in/fatma-abchouk-b49753253/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A66C2] text-white hover:bg-[#004182] rounded-md text-xs font-medium transition-all hover:scale-105 shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            LinkedIn
                          </a>
                          <a
                            href="https://github.com/Fatmaabchouk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#24292e] text-white hover:bg-black rounded-md text-xs font-medium transition-all hover:scale-105 shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                            </svg>
                            GitHub
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                      {message.role === "assistant" && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleLike(index, true)}
                          >
                            <ThumbsUp className={`h-3 w-3 ${message.liked === true ? "fill-primary text-primary" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleLike(index, false)}
                          >
                            <ThumbsDown className={`h-3 w-3 ${message.liked === false ? "fill-destructive text-destructive" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(message.content, index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="h-3 w-3 text-primary" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <span className="animate-bounce">.</span>
                      <span className="animate-bounce animation-delay-200">.</span>
                      <span className="animate-bounce animation-delay-400">.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t relative">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-background border rounded-lg shadow-xl animate-scale-in overflow-hidden">
                {/* Header with categories */}
                <div className="p-3 border-b bg-muted/50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium">Emojis</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto"
                      onClick={() => setShowEmojiPicker(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Category tabs */}
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {Object.entries(emojiCategories).map(([key, category]) => (
                      <button
                        key={key}
                        onClick={() => setEmojiCategory(key)}
                        className={`text-xl p-2 rounded hover:bg-background transition-colors flex-shrink-0 ${
                          emojiCategory === key ? "bg-background shadow-sm" : ""
                        }`}
                        title={key}
                      >
                        {category.icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Emoji grid */}
                <div className="p-3 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-8 gap-1">
                    {emojiCategories[emojiCategory as keyof typeof emojiCategories].emojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => addEmoji(emoji)}
                        className="text-2xl hover:bg-muted rounded p-2 transition-all hover:scale-110"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={isLoading}
                className="flex-shrink-0 hover:bg-muted"
              >
                <Smile className="h-5 w-5" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="💬 Posez votre question..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;