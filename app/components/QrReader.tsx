import { useRef, useEffect, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useNavigate } from "react-router-dom";
import { Container, Button, Form } from "react-bootstrap";
import toast from "react-hot-toast";

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const navigate = useNavigate();
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    let isActive = true; // flag para controlar si seguimos escaneando

    if (scanning && videoRef.current) {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      codeReader
        .listVideoInputDevices()
        .then((videoInputDevices) => {
          if (!isActive) return; // si ya pararon, no hacer nada

          if (videoInputDevices.length === 0) {
            toast.error("No se encontró ninguna cámara disponible.");
            setScanning(false);
            return;
          }

          codeReader
            .decodeFromInputVideoDevice(
              videoInputDevices[0].deviceId,
              videoRef.current!
            )
            .then((result) => {
              if (!isActive) return;

              const text = result.getText();
              setQrData(text);
              setScanning(false);

              const idFromQr = text.split("/").pop();
              if (idFromQr) {
                navigate(`/reservationdetail/${idFromQr}`);
              }
            })
            .catch((err) => {
              // Solo mostramos error si el componente sigue activo y no es NotFoundException
              if (isActive && err.name !== "NotFoundException") {
                console.error("Error al escanear:", err);
                toast.error("Error al escanear el código QR.");
                setScanning(false);
              }
              // NotFoundException lo ignoramos siempre
            });
        })
        .catch((err) => {
          if (!isActive) return;
          console.error("Error al listar dispositivos de video:", err);
          toast.error("Error al acceder a la cámara.");
          setScanning(false);
        });

      return () => {
        isActive = false;
        codeReader.reset();
        codeReaderRef.current = null;
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }
      };
    }
  }, [scanning, navigate]);

  const handleScanClick = () => {
    if (scanning) {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setScanning(false);
    } else {
      setQrData(null);
      setScanning(true);
    }
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
            autoPlay
            muted
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
