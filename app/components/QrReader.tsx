import { useRef, useEffect, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaQrcode, FaStop, FaLongArrowAltLeft } from "react-icons/fa";

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const navigate = useNavigate();
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    let isActive = true;

    if (scanning && videoRef.current) {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      codeReader
        .listVideoInputDevices()
        .then((videoInputDevices) => {
          if (!isActive) return;

          if (videoInputDevices.length === 0) {
            toast.dismiss("qr-camera-error");
            toast.error("No se encontró ninguna cámara disponible.", {
              id: "qr-camera-error",
              style: {
                background: "#363636",
                color: "#fff",
              },
            });
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
              if (isActive && err.name !== "NotFoundException") {
                console.error("Error al escanear:", err);
                toast.dismiss("qr-scan-error");
                toast.error("Error al escanear el código QR.", {
                  id: "qr-scan-error",
                  style: {
                    background: "#363636",
                    color: "#fff",
                  },
                });
                setScanning(false);
              }
            });
        })
        .catch((err) => {
          if (!isActive) return;
          console.error("Error al listar dispositivos de video:", err);
          toast.dismiss("qr-access-error");
          toast.error("Error al acceder a la cámara.", {
            id: "qr-access-error",
            style: {
              background: "#363636",
              color: "#fff",
            },
          });
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

  const handleBack = () => {
    navigate(-1);
  };

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
    <div className="form-container">
      <div className="d-flex align-items-center mb-4">
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{
            cursor: 'pointer',
            fontSize: '2rem',
            transition: 'transform 0.2s ease-in-out',
            marginRight: '1rem'
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = 'scale(1.1)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = 'scale(1)')
          }
        />
        <h2 className="fw-bold text-center flex-grow-1">Escanear Código QR</h2>
      </div>

      <div className="text-center mb-4">
        <button
          type="button"
          className={`btn ${scanning ? "secondary-btn" : "primary-btn"}`}
          onClick={handleScanClick}
          style={{
            transition: "transform 0.2s ease-in-out"
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.03)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = "scale(1)")
          }
        >
          {scanning ? (
            <>
              <FaStop className="me-2" />
              Detener Escaneo
            </>
          ) : (
            <>
              <FaQrcode className="me-2" />
              Iniciar Escaneo
            </>
          )}
        </button>
      </div>

      {scanning && (
        <div className="mb-4 text-center">
          <video
            ref={videoRef}
            width="100%"
            height="auto"
            style={{
              border: "1px solid #ced4da",
              borderRadius: "0.25rem",
              maxHeight: "400px"
            }}
            autoPlay
            muted
          />
        </div>
      )}

      {qrData && (
        <div className="mb-4">
          <label htmlFor="qrData" className="form-label">
            Datos del QR escaneado:
          </label>
          <input
            id="qrData"
            type="text"
            className="form-control"
            value={qrData}
            readOnly
          />
        </div>
      )}
    </div>
  );
}
