import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Loader2, Plus, Map, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Projects() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success("Project berhasil dibuat");
      setDialogOpen(false);
      setNewProjectName("");
      setNewProjectDesc("");
      refetch();
      setLocation(`/project/${data.insertId}`);
    },
    onError: (error) => {
      toast.error(`Gagal membuat project: ${error.message}`);
    },
  });

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Project berhasil dihapus");
      refetch();
    },
    onError: (error) => {
      toast.error(`Gagal menghapus project: ${error.message}`);
    },
  });

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast.error("Nama project harus diisi");
      return;
    }
    createMutation.mutate({
      name: newProjectName,
      description: newProjectDesc,
    });
  };

  const handleDeleteProject = (id: number, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus project "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{APP_TITLE}</CardTitle>
            <CardDescription>Silakan login untuk melanjutkan</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{APP_TITLE}</h1>
            <p className="text-gray-600 mt-2">Kelola project shapefile AMDALNET Anda</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Project Baru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Project Baru</DialogTitle>
                <DialogDescription>
                  Buat project baru untuk membuat peta tapak proyek AMDALNET
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Project</Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Pembangunan Pabrik XYZ"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Deskripsi singkat tentang project"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreateProject} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Buat Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Map className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {new Date(project.createdAt).toLocaleDateString("id-ID")}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.description && (
                    <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                  )}
                  <Button
                    className="w-full"
                    onClick={() => setLocation(`/project/${project.id}`)}
                  >
                    Buka Project
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum ada project</h3>
              <p className="text-gray-600 mb-4">
                Buat project pertama Anda untuk mulai membuat peta tapak proyek AMDALNET
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Buat Project Baru
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
