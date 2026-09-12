import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Calendar, ShieldCheck, CheckCircle2 } from "lucide-react";

function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  return (
    <div className="min-h-[100dvh] w-full pt-20 sm:pt-24 pb-16 px-4 bg-base-200/40">
      <div className="max-w-xl mx-auto">
        <div className="bg-base-100/90 backdrop-blur-xl rounded-3xl border border-base-content/10 p-6 sm:p-8 space-y-8 shadow-xl">
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content">
              Your Profile
            </h1>
            <p className="text-xs sm:text-sm text-base-content/60">
              Manage your personal information and photo
            </p>
          </div>

          {/* Avatar Upload Container */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="size-32 sm:size-36 rounded-3xl overflow-hidden ring-4 ring-emerald-500/30 p-1 bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 shadow-xl group-hover:ring-emerald-500/60 transition-all">
                {selectedImg || authUser?.profilePic ? (
                  <img
                    src={selectedImg || authUser?.profilePic}
                    alt="Profile"
                    className="w-full h-full rounded-[22px] object-cover bg-base-100"
                  />
                ) : (
                  <div className="w-full h-full rounded-[22px] bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-3xl">
                    {getInitials(authUser?.fullName)}
                  </div>
                )}
              </div>

              <label
                htmlFor="avatar-upload"
                className={`
                  absolute -bottom-2 -right-2 
                  bg-emerald-600 hover:bg-emerald-500 text-white
                  p-3 rounded-2xl cursor-pointer 
                  shadow-lg shadow-emerald-600/30
                  active:scale-90 transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none opacity-80" : ""}
                `}
                title="Change photo"
              >
                <Camera className="size-4.5" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-xs text-base-content/50 font-medium">
              {isUpdatingProfile ? "Uploading image..." : "Tap camera icon to update photo"}
            </p>
          </div>

          {/* Personal Information Group */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-base-content/70 flex items-center gap-2">
                <User className="size-3.5 text-emerald-500" />
                <span>Full Name</span>
              </label>
              <div className="px-4 py-3 bg-base-200/60 rounded-2xl border border-base-content/5 font-semibold text-sm text-base-content">
                {authUser?.fullName}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-base-content/70 flex items-center gap-2">
                <Mail className="size-3.5 text-emerald-500" />
                <span>Email Address</span>
              </label>
              <div className="px-4 py-3 bg-base-200/60 rounded-2xl border border-base-content/5 font-semibold text-sm text-base-content">
                {authUser?.email}
              </div>
            </div>
          </div>

          {/* Account Status Card */}
          <div className="p-4 sm:p-5 bg-base-200/40 rounded-2xl border border-base-content/10 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-500" />
              <span>Account Status & Information</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-base-content/5">
                <span className="text-base-content/60 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-base-content/40" />
                  Member Since
                </span>
                <span className="font-semibold text-base-content">
                  {authUser?.createdAt
                    ? new Date(authUser.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Active Member"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-base-content/60 flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  Account Status
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
