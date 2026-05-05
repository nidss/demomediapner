import { RiInstagramLine, RiFacebookCircleLine, RiTwitterXLine, RiTiktokLine, RiYoutubeLine, RiLinkedinBoxLine, RiHeartLine, RiChat1Line, RiShareLine, RiThumbUpLine, RiBookmarkLine, RiMoreLine, RiPlayCircleLine } from "react-icons/ri";
import type { Platform, ContentType } from "@/lib/content-utils";

interface PreviewProps {
  platform: Platform;
  title: string;
  caption: string;
  contentType: ContentType;
  mediaUrl?: string | null;
}

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
  instagram: RiInstagramLine,
  facebook: RiFacebookCircleLine,
  twitter: RiTwitterXLine,
  tiktok: RiTiktokLine,
  youtube: RiYoutubeLine,
  linkedin: RiLinkedinBoxLine,
};

function AvatarPlaceholder({ size = 8 }: { size?: number }) {
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex-shrink-0`} />
  );
}

function MediaDisplay({ type, mediaUrl, className }: { type: ContentType; mediaUrl?: string | null; className?: string }) {
  if (mediaUrl) {
    if (type === "video") {
      return (
        <div className={`bg-black flex items-center justify-center relative ${className ?? ""}`}>
          <video src={mediaUrl} className="w-full h-full object-cover" />
          <RiPlayCircleLine className="absolute text-white/80 text-4xl pointer-events-none" />
        </div>
      );
    }
    return <img src={mediaUrl} alt="media" className={`object-cover ${className ?? ""}`} />;
  }
  return (
    <div className={`bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center ${className ?? ""}`}>
      {type === "video" ? (
        <RiPlayCircleLine className="text-slate-400 text-4xl" />
      ) : (
        <div className="text-slate-300 text-xs font-medium">Image</div>
      )}
    </div>
  );
}

function InstagramPreview({ title, caption, contentType, mediaUrl }: PreviewProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 text-xs font-sans max-w-xs mx-auto">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <AvatarPlaceholder size={8} />
        <div>
          <div className="font-semibold text-[11px] text-gray-900">your_brand</div>
          <div className="text-[10px] text-gray-500">Original</div>
        </div>
        <RiMoreLine className="ml-auto text-gray-500 text-base" />
      </div>
      <MediaDisplay type={contentType} mediaUrl={mediaUrl} className="aspect-square w-full" />
      <div className="px-3 py-2">
        <div className="flex gap-3 mb-2 text-gray-800">
          <RiHeartLine className="text-xl" />
          <RiChat1Line className="text-xl" />
          <RiShareLine className="text-xl" />
          <RiBookmarkLine className="text-xl ml-auto" />
        </div>
        <div className="text-[11px] font-semibold text-gray-900 mb-0.5">1,248 likes</div>
        <div className="text-[11px] text-gray-800 leading-tight line-clamp-3">
          <span className="font-semibold">your_brand</span> {caption || title || "Your caption here..."}
        </div>
      </div>
    </div>
  );
}

function FacebookPreview({ title, caption, contentType, mediaUrl }: PreviewProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 text-xs max-w-xs mx-auto">
      <div className="flex items-center gap-2 px-3 py-3">
        <AvatarPlaceholder size={9} />
        <div>
          <div className="font-semibold text-[12px] text-gray-900">Your Brand Page</div>
          <div className="text-[10px] text-gray-500">Just now · Public</div>
        </div>
        <RiMoreLine className="ml-auto text-gray-500 text-base" />
      </div>
      <div className="px-3 pb-2 text-[12px] text-gray-800 leading-relaxed line-clamp-3">
        {caption || title || "Your post content here..."}
      </div>
      <MediaDisplay type={contentType} mediaUrl={mediaUrl} className="w-full h-40" />
      <div className="px-3 py-2 border-t border-gray-100">
        <div className="flex gap-1 text-[11px] text-gray-500 mb-2">
          <span>128 reactions</span>
          <span className="mx-1">·</span>
          <span>24 comments</span>
        </div>
        <div className="flex gap-2 border-t border-gray-100 pt-2">
          {[RiThumbUpLine, RiChat1Line, RiShareLine].map((Icon, i) => (
            <button key={i} className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-gray-500 hover:bg-gray-50 text-[11px] font-medium">
              <Icon className="text-sm" />
              <span>{["Like", "Comment", "Share"][i]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TwitterPreview({ title, caption }: PreviewProps) {
  const text = caption || title || "Your tweet content here...";
  const truncated = text.length > 280 ? text.slice(0, 277) + "..." : text;
  const charCount = text.length;
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 text-xs max-w-xs mx-auto">
      <div className="p-3">
        <div className="flex gap-2">
          <AvatarPlaceholder size={9} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="font-bold text-[12px] text-gray-900">Your Brand</span>
              <span className="text-[11px] text-gray-500">@yourbrand · now</span>
            </div>
            <p className="text-[12px] text-gray-900 mt-1 leading-relaxed">{truncated}</p>
            {charCount > 240 && (
              <div className={`text-[10px] mt-1 font-medium ${charCount > 280 ? "text-red-500" : "text-orange-500"}`}>
                {charCount}/280 characters
              </div>
            )}
            <div className="flex gap-4 mt-3 text-gray-500">
              {[RiChat1Line, RiShareLine, RiHeartLine, RiBookmarkLine].map((Icon, i) => (
                <button key={i} className="flex items-center gap-1 hover:text-blue-500 text-[11px]">
                  <Icon className="text-sm" />
                  {i === 0 && <span>12</span>}
                  {i === 2 && <span>89</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TikTokPreview({ title, caption, contentType, mediaUrl }: PreviewProps) {
  return (
    <div className="bg-black rounded-xl overflow-hidden text-xs max-w-[160px] mx-auto" style={{ aspectRatio: "9/16" }}>
      <div className="relative h-full">
        <MediaDisplay type={contentType} mediaUrl={mediaUrl} className="absolute inset-0 w-full h-full bg-gradient-to-b from-zinc-800 to-zinc-900" />
        <div className="absolute inset-0 flex flex-col justify-end p-3">
          <div className="text-white mb-2">
            <div className="font-semibold text-[11px] mb-1">@yourbrand</div>
            <p className="text-[10px] text-gray-200 leading-tight line-clamp-2">{caption || title || "Caption here..."}</p>
          </div>
        </div>
        <div className="absolute right-2 bottom-16 flex flex-col gap-4 items-center">
          <AvatarPlaceholder size={8} />
          {[RiHeartLine, RiChat1Line, RiBookmarkLine, RiShareLine].map((Icon, i) => (
            <div key={i} className="text-white text-center">
              <Icon className="text-xl mx-auto" />
              {i < 2 && <div className="text-[9px] text-gray-300 mt-0.5">{i === 0 ? "12K" : "824"}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function YouTubePreview({ title, caption, contentType, mediaUrl }: PreviewProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 text-xs max-w-xs mx-auto">
      <MediaDisplay type={contentType} mediaUrl={mediaUrl} className="w-full h-36 rounded-t-xl" />
      <div className="p-3 flex gap-2">
        <AvatarPlaceholder size={8} />
        <div>
          <div className="font-semibold text-[11px] text-gray-900 line-clamp-2 leading-tight">{title || "Your Video Title Here"}</div>
          <div className="text-[10px] text-gray-500 mt-1">Your Brand Channel</div>
          <div className="text-[10px] text-gray-400">1.2K views · Just now</div>
        </div>
      </div>
    </div>
  );
}

function LinkedInPreview({ title, caption, contentType, mediaUrl }: PreviewProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 text-xs max-w-xs mx-auto">
      <div className="flex items-start gap-2 px-3 py-3">
        <AvatarPlaceholder size={10} />
        <div>
          <div className="font-semibold text-[12px] text-gray-900">Your Brand</div>
          <div className="text-[10px] text-gray-500">Company · 1,240 followers</div>
          <div className="text-[10px] text-gray-400">Just now · <span>&#127758;</span></div>
        </div>
        <button className="ml-auto text-blue-600 font-semibold text-[11px] border border-blue-500 rounded-full px-2 py-0.5">+ Follow</button>
      </div>
      <div className="px-3 pb-2 text-[12px] text-gray-800 leading-relaxed line-clamp-3">
        {caption || title || "Your post content here..."}
      </div>
      <MediaDisplay type={contentType} mediaUrl={mediaUrl} className="w-full h-36" />
      <div className="px-3 py-2 border-t border-gray-100">
        <div className="flex gap-1 text-[10px] text-gray-500 mb-2">
          <span>48 reactions</span>
          <span className="mx-1">·</span>
          <span>12 comments</span>
        </div>
        <div className="flex border-t border-gray-100 pt-2">
          {[
            { Icon: RiThumbUpLine, label: "Like" },
            { Icon: RiChat1Line, label: "Comment" },
            { Icon: RiShareLine, label: "Share" },
          ].map(({ Icon, label }, i) => (
            <button key={i} className="flex-1 flex items-center justify-center gap-1 py-1 text-[11px] text-gray-500 font-medium hover:bg-gray-50 rounded">
              <Icon className="text-sm" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const PREVIEW_COMPONENTS: Record<Platform, React.ComponentType<PreviewProps>> = {
  instagram: InstagramPreview,
  facebook: FacebookPreview,
  twitter: TwitterPreview,
  tiktok: TikTokPreview,
  youtube: YouTubePreview,
  linkedin: LinkedInPreview,
};

export function PlatformPreview(props: PreviewProps) {
  const Component = PREVIEW_COMPONENTS[props.platform];
  return <Component {...props} />;
}

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const Icon = PLATFORM_ICONS[platform];
  return <Icon className={className} />;
}
