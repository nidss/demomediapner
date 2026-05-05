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
        <div className="relative rounded-xl overflow-hidden border border-card-border bg-card">
          {isUploading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <RiLoaderLine className="text-primary text-3xl animate-spin" />
              <div className="text-sm text-muted-foreground">Uploading... {progress}%</div>
              <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
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
                <div className="flex items-center justify-center h-40 bg-slate-100 gap-3">
                  <RiVideoLine className="text-slate-400 text-3xl" />
                  <span className="text-sm text-muted-foreground font-medium">{fileName ?? "Video uploaded"}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 bg-slate-50 gap-3">
                  <RiImageLine className="text-slate-300 text-3xl" />
                  <span className="text-sm text-muted-foreground">{fileName ?? "File uploaded"}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
              >
                <RiCloseLine className="text-base" />
              </button>
              {fileName && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-1.5">
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
          className="flex flex-col items-center justify-center gap-3 h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-accent/20 transition-colors"
        >
          <RiUploadCloud2Line className="text-3xl text-muted-foreground" />
          <div className="text-center">
            <div className="text-sm font-medium text-foreground">{label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {accept === "image" ? "PNG, JPG, GIF up to 10MB" : accept === "video" ? "MP4, MOV, WebM up to 10MB" : "Image or video, up to 10MB"}
            </div>
            <div className="text-xs text-muted-foreground">Drag & drop or click to browse</div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive mt-1">{error.message}</p>
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
