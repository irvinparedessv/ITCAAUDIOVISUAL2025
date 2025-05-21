import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Card, Spinner } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import { getPerfil, updateProfile } from "~/services/userService";
import type { UserProfileUpdateDTO } from "~/types/user";

const EditPerfil = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UserProfileUpdateDTO>({
    first_name: "",
    last_name: "",
    email: "",
    role_id: 1,
    phone: "",
    address: "",
    estado: 1,
    image: "",
    image_url: "",
  });
  const [previewImage, setPreviewImage] = useState<string>("");

  useEffect(() => {
    getPerfil()
      .then((data) => {
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          role_id: data.role_id,
          phone: data.phone || "",
          address: data.address || "",
          estado: data.estado ?? 1,
          image: "",
          image_url: data.image_url || "",
        });
        setPreviewImage(data.image_url || "");
      })
      .catch(() => toast.error("Error al cargar el perfil"))
      .finally(() => setLoading(false));
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;

    if (name === "image" && files && files.length > 0) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    const form = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "image") {
        if (value instanceof File) {
          form.append("image", value);
        }
      } else {
        form.append(key, value?.toString() ?? "");
      }
    });

    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("Perfil actualizado correctamente");
      navigate("/perfil");
    } catch (error) {
      toast.error("Error al actualizar el perfil");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <Spinner animation="border" className="d-block mx-auto mt-5" />;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Editar Perfil</h2>
      <Card>
        <Card.Body>
          <div className="mb-3 text-center">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Foto de perfil"
                className="rounded-circle"
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
              />
            ) : (
              <FaUserCircle size={150} color="#ccc" />
            )}
          </div>

          <Form>
            <Form.Group controlId="first_name" className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group controlId="last_name" className="mb-3">
              <Form.Label>Apellido</Form.Label>
              <Form.Control
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group controlId="email" className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                disabled
              />
            </Form.Group>

            <Form.Group controlId="phone" className="mb-3">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group controlId="address" className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group controlId="image" className="mb-3">
              <Form.Label>Cambiar Imagen</Form.Label>
              <Form.Control
                type="file"
                name="image"
                accept="image/*"
                onChange={handleInputChange}
              />
            </Form.Group>

            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={() => navigate("/perfil")}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EditPerfil;
