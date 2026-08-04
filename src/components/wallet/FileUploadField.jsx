import React, { useRef, useState } from 'react';
import { Upload, X, FileCheck2 } from 'lucide-react';

export default function FileUploadField({ label, onChange, accept = 'image/*', capture, icon: Icon = Upload, required, hint }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    onChange(file);
    setPreview(URL.createObjectURL(file));
  };

  const clear = () => {
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1.5 block">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture={capture}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {preview ? (
        <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
          <img src={preview} alt={label} className="w-full h-32 object-cover" />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-white bg-black/50 rounded px-2 py-0.5">
            <FileCheck2 className="w-3 h-3" /> Uploaded
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-400 hover:bg-teal-50/40 flex flex-col items-center justify-center gap-2 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-teal-600" />
          </div>
          <span className="text-xs text-gray-500">{hint || 'Tap to upload'}</span>
        </button>
      )}
    </div>
  );
}