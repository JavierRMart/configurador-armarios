'use client';

import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ExportPDF({ cliente, armarios }: any) {
  const exportarPDF = async () => {
    const elemento = document.getElementById('contenido-pdf');
    if (!elemento) return;

    try {
      const canvas = await html2canvas(elemento, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // ancho A4
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // alto A4

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`planos-${cliente}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar PDF');
    }
  };

  return (
    <button
      onClick={exportarPDF}
      style={{
        background: '#1a1612',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        marginTop: '20px',
        width: '100%',
      }}
    >
      📥 Descargar PDF
    </button>
  );
}