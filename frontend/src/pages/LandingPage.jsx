import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import {
  MessagesSquare,
  Sparkles,
  ShieldCheck,
  Palette,
  Mic,
  Smile,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Lock,
  Zap,
  Globe,
  Star,
  ChevronDown,
  Volume2,
  Play,
  Heart,
  MessageCircle,
} from "lucide-react";

const LandingPage = () => {
  const { authUser } = useAuthStore();
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content overflow-x-hidden pt-16">
      {/* ========================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/15 dark:bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="container mx-auto px-4 max-w-6xl">
          {/* Top Floating Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-3 duration-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Next-Gen Real-Time Messaging • Free Forever</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] text-base-content">
              Connect Instantly. <br className="hidden sm:inline" />
              Chat Freely.{" "}
              <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                Express Without Limits.
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-base-content/70 max-w-2xl mx-auto leading-relaxed">
              Experience the speed of WhatsApp with delightful animated meme stickers,
              crystal-clear studio voice notes, 32+ custom themes, and complete privacy controls.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              {authUser ? (
                <Link
                  to="/"
                  className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-none text-white px-7 py-3 rounded-full text-base font-semibold shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:scale-102 active:scale-98 transition-all flex items-center gap-2"
                >
                  <span>Open Your Chat</span>
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-none text-white px-8 py-3.5 rounded-full text-base font-semibold shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:scale-102 active:scale-98 transition-all flex items-center gap-2 w-full sm:w-auto"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    to="/login"
                    className="btn btn-ghost border border-base-300 hover:border-emerald-500/50 hover:bg-base-200/80 px-7 py-3.5 rounded-full text-base font-medium transition-all w-full sm:w-auto"
                  >
                    <span>Sign In to Account</span>
                  </Link>
                </>
              )}
            </div>

            {/* Micro Highlights */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-base-content/60">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Zero setup required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Real-time WebSocket sync
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                End-to-end private & secure
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* INTERACTIVE LIVE CHAT MOCKUP WINDOW */}
          {/* ========================================================= */}
          <div className="mt-12 md:mt-16 max-w-4xl mx-auto">
            <div className="relative rounded-2xl md:rounded-3xl p-1.5 md:p-2.5 bg-gradient-to-b from-base-300 via-base-200 to-base-300 shadow-2xl border border-base-300">
              <div className="bg-base-100 rounded-xl md:rounded-2xl overflow-hidden border border-base-content/10 flex flex-col md:flex-row h-[460px] md:h-[500px]">
                {/* Left Mini Sidebar Preview (Hidden on mobile) */}
                <div className="hidden md:flex w-72 bg-base-200/60 border-r border-base-300 flex-col">
                  <div className="p-3 border-b border-base-300 flex items-center justify-between">
                    <span className="font-bold text-sm">Chats</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-semibold px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  </div>
                  <div className="p-2 space-y-1 overflow-y-auto">
                    {/* Active Contact */}
                    <div className="p-2.5 rounded-xl bg-base-200 border-l-4 border-emerald-500 flex items-center gap-3">
                      <div className="relative">
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                          alt="Elena"
                          className="size-10 rounded-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 rounded-full ring-2 ring-base-100" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-xs truncate">Elena Rostova</h4>
                          <span className="text-[10px] text-base-content/50">Now</span>
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate">
                          Look at this sticker! 😂
                        </p>
                      </div>
                    </div>

                    {/* Contact 2 */}
                    <div className="p-2.5 rounded-xl hover:bg-base-200/50 flex items-center gap-3 opacity-70">
                      <div className="relative">
                        <img
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                          alt="Alex"
                          className="size-10 rounded-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-xs truncate">Alex Miller</h4>
                          <span className="text-[10px] text-base-content/50">10:42 AM</span>
                        </div>
                        <p className="text-[11px] text-base-content/60 truncate">🎙️ Voice message (0:14)</p>
                      </div>
                    </div>

                    {/* Contact 3 */}
                    <div className="p-2.5 rounded-xl hover:bg-base-200/50 flex items-center gap-3 opacity-50">
                      <div className="relative">
                        <img
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                          alt="Sarah"
                          className="size-10 rounded-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-xs truncate">Sarah Connor</h4>
                          <span className="text-[10px] text-base-content/50">Yesterday</span>
                        </div>
                        <p className="text-[11px] text-base-content/60 truncate">See you at the meetup!</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Chat Area */}
                <div className="flex-1 flex flex-col bg-base-100/90 relative">
                  {/* Chat Header */}
                  <div className="px-4 py-2.5 border-b border-base-300 flex items-center justify-between bg-base-100/80">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                          alt="Elena"
                          className="size-9 rounded-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 size-2 bg-emerald-500 rounded-full ring-2 ring-base-100" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs sm:text-sm">Elena Rostova</h4>
                        <span className="text-[10px] text-emerald-500 font-medium">online</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-base-content/50">
                      <span className="px-2 py-0.5 rounded-full bg-base-200 text-[10px]">
                        🔒 End-to-End Encrypted
                      </span>
                    </div>
                  </div>

                  {/* Message Bubbles Area */}
                  <div className="flex-1 p-3.5 space-y-3 overflow-y-auto bg-base-200/30">
                    {/* Incoming Message */}
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl rounded-tl-xs px-3.5 py-2 bg-base-100 border border-base-300 shadow-xs text-xs">
                        <p className="text-base-content">
                          Hey! Have you tried the new animated stickers on NexChat? They loop continuously! 🔥
                        </p>
                        <span className="text-[9px] text-base-content/40 block text-right mt-1">
                          10:44 AM
                        </span>
                      </div>
                    </div>

                    {/* Outgoing Message with Animated Pop Cat Sticker */}
                    <div className="flex justify-end">
                      <div className="flex flex-col items-end">
                        <div className="relative p-1 bg-transparent group">
                          <img
                            src="/stickers/popcat.svg"
                            alt="Pop Cat Animated"
                            className="w-28 h-28 object-contain filter drop-shadow-md hover:scale-105 transition-transform"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-full text-[9px] flex items-center gap-1 shadow-sm">
                            <span>10:45 AM</span>
                            <span className="text-[#53bdeb]">✓✓</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Outgoing Voice Note Mockup */}
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-tr-xs px-3.5 py-2 bg-emerald-600 text-white shadow-sm text-xs max-w-[85%] flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-white/30 transition-colors">
                          <Play size={14} className="fill-white ml-0.5" />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          {/* Simulated Audio Waveform */}
                          <div className="flex items-center gap-0.5 h-4 my-1">
                            {[40, 75, 55, 90, 60, 100, 45, 80, 70, 95, 50, 85, 40, 60, 30].map(
                              (h, i) => (
                                <span
                                  key={i}
                                  className="w-1 bg-white/80 rounded-full"
                                  style={{ height: `${h}%` }}
                                />
                              )
                            )}
                          </div>
                          <div className="flex justify-between text-[10px] text-white/80">
                            <span>0:18</span>
                            <span>✓✓</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Incoming Typing Indicator */}
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-tl-xs px-3 py-1.5 bg-base-100 border border-base-300 shadow-xs text-xs flex items-center gap-1.5">
                        <span className="font-semibold text-emerald-500 text-[11px]">Elena</span>
                        <span className="text-base-content/60 text-[10px]">is typing</span>
                        <span className="loading loading-dots loading-xs text-emerald-500"></span>
                      </div>
                    </div>
                  </div>

                  {/* Input Bar Mockup */}
                  <div className="p-2 border-t border-base-300 bg-base-100 flex items-center gap-2">
                    <div className="flex items-center gap-1 text-base-content/60 pl-1">
                      <Smile size={18} className="hover:text-emerald-500 transition-colors cursor-pointer" />
                      <Palette size={18} className="hover:text-emerald-500 transition-colors cursor-pointer" />
                    </div>
                    <div className="flex-1 bg-base-200 rounded-full px-3.5 py-1.5 text-xs text-base-content/50">
                      Type a message...
                    </div>
                    <div className="size-8 rounded-full bg-emerald-600 text-white flex items-center justify-center cursor-pointer shadow-xs">
                      <Mic size={15} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. CURATED VISUAL LIFESTYLE / UNSPLASH SECTION */}
      {/* ========================================================= */}
      <section className="py-16 md:py-24 bg-base-200/50 border-y border-base-300">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Globe size={13} />
                <span>Connected Everywhere</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-base-content leading-snug">
                Built for conversations that feel like being in the same room.
              </h2>

              <p className="text-base text-base-content/70 leading-relaxed">
                Whether you’re sharing late-night laughs, recording a quick voice thought on the go,
                or sending your favorite anime meme sticker, NexChat makes every interaction instant,
                vibrant, and deeply personal.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Ultra-Low Latency Messaging</h4>
                    <p className="text-xs text-base-content/60">
                      Messages and reactions land in less than 20 milliseconds across the globe.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Live Voice Notes & Audio Waves</h4>
                    <p className="text-xs text-base-content/60">
                      Record, preview, and play crystal-clear voice notes with scrubbable waveforms.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Fine-Grained Privacy</h4>
                    <p className="text-xs text-base-content/60">
                      Decide who sees your online status and last seen timestamp with a single toggle.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual Image Composition */}
            <div className="relative">
              {/* Primary Unsplash Image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-base-300 group">
                <img
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80"
                  alt="Friends laughing and chatting together"
                  className="w-full h-[380px] sm:h-[440px] object-cover group-hover:scale-103 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Floating Glassmorphic Notification Card 1 */}
                <div className="absolute top-5 -left-3 sm:-left-6 bg-base-100/90 dark:bg-base-200/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-base-300 max-w-[220px] animate-in fade-in slide-in-from-left duration-700">
                  <div className="flex items-center gap-2">
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"
                      alt="Avatar"
                      className="size-8 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold truncate">Marcus sent a voice note</p>
                      <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                        <Volume2 size={10} /> 0:24 • Just now
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating Glassmorphic Notification Card 2 */}
                <div className="absolute bottom-6 -right-3 sm:-right-6 bg-base-100/90 dark:bg-base-200/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-base-300 flex items-center gap-2.5 animate-in fade-in slide-in-from-right duration-700">
                  <img
                    src="/stickers/popcat.svg"
                    alt="Popcat"
                    className="size-9 object-contain"
                  />
                  <div>
                    <p className="text-[11px] font-bold">New Animated Sticker!</p>
                    <p className="text-[10px] text-base-content/60">Pop Cat added to favorites</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. CORE FEATURES GRID */}
      {/* ========================================================= */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Feature-Packed Experience
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-base-content">
              Everything you need to stay in sync.
            </h3>
            <p className="text-sm sm:text-base text-base-content/70">
              From expressive animated reactions to rock-solid privacy settings, NexChat delivers a modern messaging suite.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-base-200/60 hover:bg-base-200 border border-base-300 transition-all hover:shadow-lg hover:-translate-y-1 space-y-3">
              <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Sparkles size={22} />
              </div>
              <h4 className="text-lg font-bold text-base-content">Animated Looping Stickers</h4>
              <p className="text-xs text-base-content/70 leading-relaxed">
                Enjoy built-in animated memes like Pop Cat and Crying Cat, or upload your own multi-frame animated GIFs and WebPs with 1 click.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-base-200/60 hover:bg-base-200 border border-base-300 transition-all hover:shadow-lg hover:-translate-y-1 space-y-3">
              <div className="size-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Mic size={22} />
              </div>
              <h4 className="text-lg font-bold text-base-content">Studio Voice Notes</h4>
              <p className="text-xs text-base-content/70 leading-relaxed">
                Send voice notes effortlessly. Includes live recording timer, wave visualizers, scrubber playback, and noise-free audio delivery.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-base-200/60 hover:bg-base-200 border border-base-300 transition-all hover:shadow-lg hover:-translate-y-1 space-y-3">
              <div className="size-11 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <h4 className="text-lg font-bold text-base-content">Online & Last Seen Privacy</h4>
              <p className="text-xs text-base-content/70 leading-relaxed">
                Maintain complete control over your availability. Toggle visibility on or off without blocking contacts or breaking chats.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-base-200/60 hover:bg-base-200 border border-base-300 transition-all hover:shadow-lg hover:-translate-y-1 space-y-3">
              <div className="size-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Palette size={22} />
              </div>
              <h4 className="text-lg font-bold text-base-content">32+ Beautiful Themes</h4>
              <p className="text-xs text-base-content/70 leading-relaxed">
                From sleek Dark and Emerald modes to Synthwave, Cyberpunk, and Luxury themes. Personalize your chat exactly how you like it.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-base-200/60 hover:bg-base-200 border border-base-300 transition-all hover:shadow-lg hover:-translate-y-1 space-y-3">
              <div className="size-11 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                <Smartphone size={22} />
              </div>
              <h4 className="text-lg font-bold text-base-content">100% Mobile Responsive</h4>
              <p className="text-xs text-base-content/70 leading-relaxed">
                Native WhatsApp-style mobile experience. Responsive drawer heights, touch-friendly gestures, and continuous keyboard focus.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-base-200/60 hover:bg-base-200 border border-base-300 transition-all hover:shadow-lg hover:-translate-y-1 space-y-3">
              <div className="size-11 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                <Zap size={22} />
              </div>
              <h4 className="text-lg font-bold text-base-content">Instant Socket Reactions</h4>
              <p className="text-xs text-base-content/70 leading-relaxed">
                React to any message with emojis, edit mistakes on the fly, and quote messages with seamless swipe & reply mechanics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. PHOTO GALLERY & REAL PEOPLE CONNECTING (UNSPLASH) */}
      {/* ========================================================= */}
      <section className="py-16 md:py-24 bg-base-200/40 border-t border-base-300">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Global Connection
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-base-content">
              Connecting thousands of conversations every day
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-md group">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80"
                alt="Colleagues collaborating"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3.5">
                <span className="text-white text-xs font-semibold">Team Collaboration</span>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-md group">
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80"
                alt="Modern workspace"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3.5">
                <span className="text-white text-xs font-semibold">Creative Discussions</span>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-md group">
              <img
                src="https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?auto=format&fit=crop&w=600&q=80"
                alt="Friends having fun"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3.5">
                <span className="text-white text-xs font-semibold">Daily Sharing</span>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-md group">
              <img
                src="https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=600&q=80"
                alt="Family and friends"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3.5">
                <span className="text-white text-xs font-semibold">Always In Touch</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. TESTIMONIALS / COMMUNITY TRUST */}
      {/* ========================================================= */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Community Love
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-base-content">
              Loved by creators, teams, and friends.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="p-6 rounded-2xl bg-base-200/50 border border-base-300 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex text-amber-400 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs text-base-content/80 leading-relaxed italic">
                  "The animated sticker creator is unmatched. I uploaded our team’s inside-joke GIF and it looped instantly in the chat. NexChat is our new daily favorite!"
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                  alt="Sarah"
                  className="size-10 rounded-full object-cover border border-base-300"
                />
                <div>
                  <h4 className="font-bold text-xs">Sarah Jenkins</h4>
                  <p className="text-[10px] text-base-content/50">Product Designer</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-6 rounded-2xl bg-base-200/50 border border-base-300 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex text-amber-400 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs text-base-content/80 leading-relaxed italic">
                  "Voice notes feel just like WhatsApp, but the themes make it 10x cooler. Being able to switch between Cyberpunk and Dracula mode is so satisfying."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                  alt="David"
                  className="size-10 rounded-full object-cover border border-base-300"
                />
                <div>
                  <h4 className="font-bold text-xs">David Chen</h4>
                  <p className="text-[10px] text-base-content/50">Full-Stack Engineer</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-6 rounded-2xl bg-base-200/50 border border-base-300 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex text-amber-400 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs text-base-content/80 leading-relaxed italic">
                  "I love having full control over my last seen and online status. It gives me peace of mind while chatting with family and friends on mobile."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  alt="Elena"
                  className="size-10 rounded-full object-cover border border-base-300"
                />
                <div>
                  <h4 className="font-bold text-xs">Elena Martinez</h4>
                  <p className="text-[10px] text-base-content/50">Creative Lead</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. FAQ SECTION */}
      {/* ========================================================= */}
      <section className="py-16 md:py-20 bg-base-200/30 border-t border-base-300">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Questions & Answers
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-base-content">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Is NexChat completely free to use?",
                a: "Yes! NexChat is 100% free to use. You can send unlimited real-time text messages, voice recordings, animated stickers, and high-res attachments without any hidden fees.",
              },
              {
                q: "How do animated stickers work?",
                a: "NexChat comes loaded with popular animated memes (like Pop Cat, Crying Cat, and Mochi Cat). You can also click '+ Create' in the sticker drawer and upload any animated .gif or animated .webp file directly from your phone or computer!",
              },
              {
                q: "Can other people see when I'm online?",
                a: "Only if you want them to! Go to Settings and toggle 'Show Online & Last Seen Status'. When turned off, your presence and last seen time remain completely private.",
              },
              {
                q: "Does NexChat work well on mobile phones?",
                a: "Absolutely. NexChat is built mobile-first with touch-friendly drawer heights, persistent keyboard focus, swipe reactions, and adaptive WhatsApp-style responsive layouts.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-base-100 rounded-xl border border-base-300 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between font-semibold text-xs sm:text-sm text-base-content hover:bg-base-200/50 transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 text-base-content/60 flex-shrink-0 ml-2 ${
                      activeFaq === idx ? "rotate-180 text-emerald-500" : ""
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-base-content/70 leading-relaxed border-t border-base-300/50 pt-3 animate-in fade-in duration-150">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. HIGH IMPACT FINAL CALL TO ACTION */}
      {/* ========================================================= */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 sm:p-12 md:p-16 text-white text-center shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />

            <div className="relative max-w-2xl mx-auto space-y-5">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Ready to elevate your daily messaging?
              </h2>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                Join thousands who connect, laugh, and collaborate with NexChat. Create your account in less than 30 seconds.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                {authUser ? (
                  <Link
                    to="/"
                    className="btn bg-white text-emerald-700 hover:bg-white/95 border-none px-8 py-3 rounded-full text-base font-bold shadow-lg hover:scale-102 active:scale-98 transition-all"
                  >
                    Open Chat Now
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className="btn bg-white text-emerald-700 hover:bg-white/95 border-none px-8 py-3 rounded-full text-base font-bold shadow-lg hover:scale-102 active:scale-98 transition-all w-full sm:w-auto"
                    >
                      Sign Up for Free
                    </Link>
                    <Link
                      to="/login"
                      className="btn btn-ghost text-white hover:bg-white/10 px-7 py-3 rounded-full text-base font-medium border border-white/30 w-full sm:w-auto"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. SLEEK FOOTER */}
      {/* ========================================================= */}
      <footer className="border-t border-base-300 py-8 bg-base-200/40 text-base-content/70 text-xs">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <MessagesSquare size={14} />
            </div>
            <span className="font-bold text-sm text-base-content">NexChat</span>
            <span className="text-[10px] text-base-content/40 ml-2">
              © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <Link to="/settings" className="hover:text-emerald-500 transition-colors">
              Themes
            </Link>
            <Link to="/login" className="hover:text-emerald-500 transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="hover:text-emerald-500 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
