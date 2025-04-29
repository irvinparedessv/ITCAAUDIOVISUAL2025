import { useRef, useEffect, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useNavigate } from "react-router-dom"; // 👈 Importamos useNavigate
import { Container, Button, Form } from "react-bootstrap";

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const navigate = useNavigate(); // 👈

  useEffect(() => {
    if (scanning && videoRef.current) {
      const codeReader = new BrowserMultiFormatReader();
      codeReader
        .decodeFromInputVideoDevice(undefined, videoRef.current)
        .then((result) => {
          const text = result.getText();
          setQrData(text);
          setScanning(false);

          // 👇 Aquí haces la navegación al escanear
          const idFromQr = text.split("/").pop(); // extrae el ID del final de la URL
          if (idFromQr) {
            navigate(`/reservationdetail/${idFromQr}`);
          }
        })
        .catch((err) => {
          console.error("Error al escanear:", err);
        });

      return () => {
        codeReader.reset();
      };
    }
  }, [scanning, navigate]);

  const handleScanClick = () => {
    setScanning((prev) => !prev);
  };

  return (
    <Container className="my-5 text-center">
      <h3>Escanear Código QR</h3>

      <Button variant="primary" onClick={handleScanClick} className="my-3">
        {scanning ? "Detener Escaneo" : "Iniciar Escaneo"}
      </Button>

      {scanning && (
        <div>
          <video
            ref={videoRef}
            width="100%"
            height="auto"
            style={{ border: "1px solid black" }}
          />
        </div>
      )}

      {qrData && (
        <Form.Group className="mt-3">
          <Form.Label>Datos del QR escaneado:</Form.Label>
          <Form.Control type="text" value={qrData} readOnly />
        </Form.Group>
      )}
    </Container>
  );
}
