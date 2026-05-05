import { useRef, useState } from "react";
import { useUpload } from "@workspace/object-storage-web";
import { RiUploadCloud2Line, RiCloseLine, RiImageLine, RiVideoLine, RiLoaderLine } from "react-icons/ri";

interface MediaUploaderProps {
  value: string | null | undefined;
  onChange: (objectPath: string | null) => void;
  accept?: "image" | "video" | "both";
  label?: string;
}

const ACCEPT_MAP = {
  image: "image/*",
  video: "video/*",
  both: "image/*,video/*",
};

function isVideo(path: string) {
  return /\.(mp4|mov|webm|avi|mkv)$/i.test(path);
}

export function MediaUploader({
  value,
  onChange,
  accept = "both",
  label = "Upload Media",
}: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const { uploadFile, isUploading, progress, error } = useUpload({
    onSuccess: (res) => {
      onChange(res.objectPath);
    },
    onError: () => {
      onChange(null);
    },
  });

  async function handleFile(file: File) {
    setFileName(file.name);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
    await uploadFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleClear() {
    onChange(null);
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const servingUrl = value ? `/api/storage${value}` : null;
  const showVideo = (servingUrl && isVideo(value!)) || (fileName && /\.(mp4|mov|webm|avi|mkv)$/i.test(fileName));

  return (
    <div>
      {value || isUploading ? (
        <div className="nm-inset bg-background relative rounded-2xl overflow-hidden">
          {isUploading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <RiLoaderLine className="text-primary text-3xl animate-spin" />
              <div className="text-sm text-muted-foreground font-medium">Uploading... {progress}%</div>
              <div className="nm-inset-sm w-48 h-2 bg-background rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
              ) : servingUrl && !showVideo ? (
                <img src={servingUrl} alt="Uploaded" className="w-full h-48 object-cover" />
              ) : showVideo ? (
                <div className="flex items-center justify-center h-40 gap-3">
                  <div className="nm-raised-sm w-12 h-12 flex items-center justify-center rounded-2xl bg-background">
                    <RiVideoLine className="text-primary text-xl" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">{fileName ?? "Video uploaded"}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 gap-3">
                  <div className="nm-raised-sm w-12 h-12 flex items-center justify-center rounded-2xl bg-background">
                    <RiImageLine className="text-muted-foreground text-xl" />
                  </div>
                  <span className="text-sm text-muted-foreground">{fileName ?? "File uploaded"}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="nm-raised-sm absolute top-2 right-2 bg-background/90 hover:text-destructive text-muted-foreground rounded-xl p-1.5 transition-colors active:nm-inset"
              >
                <RiCloseLine className="text-sm" />
              </button>
              {fileName && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm px-3 py-1.5">
                  <span className="text-white text-xs truncate block">{fileName}</span>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="nm-inset bg-background flex flex-col items-center justify-center gap-3 h-40 rounded-2xl cursor-pointer hover:brightness-[1.01] transition-all group"
        >
          <div className="nm-raised-sm w-12 h-12 flex items-center justify-center rounded-2xl bg-background group-hover:text-primary text-muted-foreground transition-colors">
            <RiUploadCloud2Line className="text-xl" />
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {accept === "image" ? "PNG, JPG, GIF up to 10MB" : accept === "video" ? "MP4, MOV, WebM up to 10MB" : "Image or video, up to 10MB"}
            </div>
            <div className="text-xs text-muted-foreground">Drag & drop or click to browse</div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive mt-1.5">{error.message}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MAP[accept]}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
