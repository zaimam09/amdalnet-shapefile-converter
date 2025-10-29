import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download, Loader2, Save, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import MapEditor from "@/components/MapEditor";
import FileUploader from "@/components/FileUploader";
import { getLoginUrl } from "@/const";

export default function ProjectEditor() {
  const [, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const projectId = params?.id ? parseInt(params.id) : 0;

  const [currentGeometry, setCurrentGeometry] = useState<any>(null);
  const [currentArea, setCurrentArea] = useState<string>("");
  const [currentPolygonId, setCurrentPolygonId] = useState<number | null>(null);

  // Form state
  const [pemrakarsa, setPemrakarsa] = useState("");
  const [kegiatan, setKegiatan] = useState("");
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [provinsi, setProvinsi] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const { data: project, isLoading: projectLoading } = trpc.projects.get.useQuery(
    { id: projectId },
    { enabled: isAuthenticated && projectId > 0 }
  );

  const { data: polygons, refetch: refetchPolygons } = trpc.polygons.list.useQuery(
    { projectId },
    { enabled: isAuthenticated && projectId > 0 }
  );

  const createPolygonMutation = trpc.polygons.create.useMutation({
    onSuccess: () => {
      toast.success("Polygon berhasil disimpan");
      refetchPolygons();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Gagal menyimpan polygon: ${error.message}`);
    },
  });

  const updatePolygonMutation = trpc.polygons.update.useMutation({
    onSuccess: () => {
      toast.success("Polygon berhasil diupdate");
      refetchPolygons();
    },
    onError: (error) => {
      toast.error(`Gagal update polygon: ${error.message}`);
    },
  });

  const exportShapefileMutation = trpc.export.shapefile.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Shapefile berhasil diexport");
    },
    onError: (error) => {
      toast.error(`Gagal export shapefile: ${error.message}`);
    },
  });

  const exportPdfMutation = trpc.export.pdf.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF berhasil diexport");
    },
    onError: (error) => {
      toast.error(`Gagal export PDF: ${error.message}`);
    },
  });

  useEffect(() => {
    if (polygons && polygons.length > 0) {
      const firstPolygon = polygons[0];
      setCurrentGeometry(JSON.parse(firstPolygon.geometry));
      setCurrentArea(firstPolygon.area);
      setCurrentPolygonId(firstPolygon.id);
      setPemrakarsa(firstPolygon.pemrakarsa);
      setKegiatan(firstPolygon.kegiatan);
      setTahun(firstPolygon.tahun);
      setProvinsi(firstPolygon.provinsi);
      setKeterangan(firstPolygon.keterangan);
    }
  }, [polygons]);

  const resetForm = () => {
    setPemrakarsa("");
    setKegiatan("");
    setTahun(new Date().getFullYear());
    setProvinsi("");
    setKeterangan("");
    setCurrentGeometry(null);
    setCurrentArea("");
    setCurrentPolygonId(null);
  };

  const handleSavePolygon = () => {
    if (!currentGeometry) {
      toast.error("Silakan gambar polygon terlebih dahulu");
      return;
    }

    if (!pemrakarsa || !kegiatan || !provinsi || !keterangan) {
      toast.error("Semua field harus diisi");
      return;
    }

    const data = {
      projectId,
      pemrakarsa,
      kegiatan,
      tahun,
      provinsi,
      keterangan,
      layer: "Tapak Proyek",
      area: currentArea,
      geometry: JSON.stringify(currentGeometry),
    };

    if (currentPolygonId) {
      updatePolygonMutation.mutate({ id: currentPolygonId, ...data });
    } else {
      createPolygonMutation.mutate(data);
    }
  };

  const handleExportShapefile = () => {
    if (!polygons || polygons.length === 0) {
      toast.error("Tidak ada polygon untuk diexport");
      return;
    }
    exportShapefileMutation.mutate({ projectId });
  };

  const handleExportPDF = () => {
    if (!currentPolygonId) {
      toast.error("Tidak ada polygon untuk diexport");
      return;
    }
    exportPdfMutation.mutate({ projectId, polygonId: currentPolygonId });
  };

  if (authLoading || projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Project tidak ditemukan</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")}>Kembali ke Daftar Project</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                {project.description && (
                  <p className="text-sm text-gray-600">{project.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExportPDF}
                disabled={exportPdfMutation.isPending || !currentPolygonId}
                variant="outline"
              >
                {exportPdfMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Export PDF
              </Button>
              <Button
                onClick={handleExportShapefile}
                disabled={exportShapefileMutation.isPending || !polygons || polygons.length === 0}
              >
                {exportShapefileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export Shapefile
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <FileUploader
              onFileLoaded={(geometry, area, attributes) => {
                setCurrentGeometry(geometry);
                setCurrentArea(area);
                if (attributes) {
                  if (attributes.pemrakarsa) setPemrakarsa(attributes.pemrakarsa);
                  if (attributes.kegiatan) setKegiatan(attributes.kegiatan);
                  if (attributes.tahun) setTahun(attributes.tahun);
                  if (attributes.provinsi) setProvinsi(attributes.provinsi);
                  if (attributes.keterangan) setKeterangan(attributes.keterangan);
                }
              }}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Peta Tapak Proyek</CardTitle>
                <CardDescription>
                  Upload file atau gunakan tools di kanan atas untuk menggambar polygon tapak proyek
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px]">
                  <MapEditor
                    onPolygonCreated={(geometry, areaHa) => {
                      setCurrentGeometry(geometry);
                      setCurrentArea(areaHa);
                    }}
                    onPolygonEdited={(geometry, areaHa) => {
                      setCurrentGeometry(geometry);
                      setCurrentArea(areaHa);
                    }}
                    onPolygonDeleted={() => {
                      setCurrentGeometry(null);
                      setCurrentArea("");
                    }}
                    initialGeometry={currentGeometry}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Atribut AMDALNET</CardTitle>
                <CardDescription>Isi semua field yang diperlukan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pemrakarsa">Pemrakarsa *</Label>
                  <Input
                    id="pemrakarsa"
                    placeholder="Nama Pemrakarsa/Pelaku Usaha"
                    value={pemrakarsa}
                    onChange={(e) => setPemrakarsa(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kegiatan">Kegiatan *</Label>
                  <Input
                    id="kegiatan"
                    placeholder="Nama rencana usaha dan/atau kegiatan"
                    value={kegiatan}
                    onChange={(e) => setKegiatan(e.target.value)}
                    maxLength={254}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tahun">Tahun *</Label>
                  <Input
                    id="tahun"
                    type="number"
                    placeholder="Tahun"
                    value={tahun}
                    onChange={(e) => setTahun(parseInt(e.target.value))}
                    min={1900}
                    max={2100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provinsi">Provinsi *</Label>
                  <Input
                    id="provinsi"
                    placeholder="Nama provinsi"
                    value={provinsi}
                    onChange={(e) => setProvinsi(e.target.value)}
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keterangan">Keterangan *</Label>
                  <Input
                    id="keterangan"
                    placeholder="Alamat lokasi tapak proyek"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    maxLength={254}
                  />
                  <p className="text-xs text-gray-500">
                    Untuk tapak dalam satu Kab/Kota: isi alamat lokasi. Untuk lintas provinsi/kab: sebutkan nama-namanya.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Layer</Label>
                  <Input value="Tapak Proyek" disabled />
                </div>

                <div className="space-y-2">
                  <Label>Luas (Hektar)</Label>
                  <Input value={currentArea || "0.00000000000"} disabled />
                  <p className="text-xs text-gray-500">
                    Luas akan dihitung otomatis saat Anda menggambar polygon
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleSavePolygon}
                  disabled={createPolygonMutation.isPending || updatePolygonMutation.isPending || !currentGeometry}
                >
                  {(createPolygonMutation.isPending || updatePolygonMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {currentPolygonId ? "Update Polygon" : "Simpan Polygon"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
