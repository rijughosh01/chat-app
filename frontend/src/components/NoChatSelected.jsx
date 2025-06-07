import { MessagesSquare } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center
             justify-center animate-bounce"
            >
              <MessagesSquare className="w-10 h-10 text-primary " />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold">Welcome to NexChat!</h2>
        <p className="text-base-content/60">
          Your conversations live here. Select one to get started.
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;
