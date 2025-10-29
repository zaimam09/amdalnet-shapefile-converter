import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, Loader2, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface DocumentAnalyzerProps {
  onDataExtracted: (data: ExtractedData) => void;
}

interface ExtractedData {
  pemrakarsa: string;
  kegiatan: string;
  tahun: number;
  provinsi: string;
  keterangan: string;
  nib?: string;
  kbli?: string;
  kabupatenKota?: string;
  kecamatan?: string;
  desaKelurahan?: string;
  alamat?: string;
  luasTanah?: string;
}

export default function DocumentAnalyzer({ onDataExtracted }: DocumentAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = trpc.document.analyze.useMutation({
    onSuccess: (data: ExtractedData) => {
      toast.success("Dokumen berhasil dianalisis");
      onDataExtracted(data);
      setIsAnalyzing(false);
    },
    onError: (error: any) => {
      toast.error(`Gagal menganalisis dokumen: ${error.message}`);
      setIsAnalyzing(false);
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error("Hanya file PDF yang didukung");
      return;
    }

    setUploadedFile(file);
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      toast.error("Pilih file PDF terlebih dahulu");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:application/pdf;base64, prefix
        
        analyzeMutation.mutate({
          fileData: base64Data,
          fileName: uploadedFile.name,
        });
      };
      reader.readAsDataURL(uploadedFile);
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Gagal membaca file");
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analisis Dokumen PKKPR/NIB</CardTitle>
        <CardDescription>
          Upload dokumen PKKPR atau NIB untuk ekstraksi data otomatis dengan AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="document-upload"
          />
          <label htmlFor="document-upload">
            <Button
              variant="outline"
              className="w-full"
              disabled={isAnalyzing}
              onClick={() => fileInputRef.current?.click()}
              type="button"
              asChild
            >
              <div>
                <FileUp className="h-4 w-4 mr-2" />
                {uploadedFile ? uploadedFile.name : "Pilih File PDF"}
              </div>
            </Button>
          </label>
        </div>

        {uploadedFile && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
            <FileText className="h-5 w-5 text-gray-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">{uploadedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={handleAnalyze}
          disabled={!uploadedFile || isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Menganalisis dokumen...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Analisis dengan AI
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500">
          AI akan mengekstrak informasi seperti Pemrakarsa, NIB, KBLI, Kegiatan, Lokasi, dan data lainnya dari dokumen
        </p>
      </CardContent>
    </Card>
  );
}
