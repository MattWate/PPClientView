// Replace the AreaQRCodeModal component in src/pages/Sites.jsx

const AreaQRCodeModal = ({ area, isOpen, onClose }) => {
    if (!isOpen || !area) return null;

    const handlePrint = () => window.print();

    return (
        <>
            <style>
                {`
                    @media print {
                        /* Hide everything on the page */
                        body * {
                            visibility: hidden;
                        }
                        
                        /* Show only the printable content */
                        #qr-printable-area,
                        #qr-printable-area * {
                            visibility: visible;
                        }
                        
                        /* Position the printable area at the top of the page */
                        #qr-printable-area {
                            position: absolute;
                            left: 50%;
                            top: 50%;
                            transform: translate(-50%, -50%);
                            width: auto;
                            max-width: 100%;
                        }
                        
                        /* Remove modal styling for print */
                        .modal-backdrop {
                            display: none;
                        }
                        
                        /* Hide buttons during print */
                        .no-print {
                            display: none !important;
                        }
                        
                        /* Ensure good print quality */
                        #qr-printable-area {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                `}
            </style>
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center transition-opacity modal-backdrop" 
                onClick={onClose}
            >
                <div 
                    className="bg-white rounded-lg shadow-xl max-w-sm w-full m-4 flex flex-col z-50" 
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header - Hidden during print */}
                    <div className="flex justify-between items-center p-4 border-b no-print">
                        <h3 className="text-xl font-semibold">QR Code for "{area.name}"</h3>
                        <button 
                            onClick={onClose} 
                            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                        >
                            &times;
                        </button>
                    </div>
                    
                    {/* Printable Content */}
                    <div id="qr-printable-area" className="p-6 flex flex-col items-center">
                        <div className="text-center mb-4">
                            <h2 className="text-2xl font-bold">{area.name}</h2>
                            <p className="text-lg text-gray-600">Zone: {area.zoneName}</p>
                            <p className="text-md text-gray-500">Site: {area.siteName}</p>
                        </div>
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://pristinecp.netlify.app/scan/${area.id}`}
                            alt={`QR Code for ${area.name}`}
                            className="w-64 h-64 object-contain"
                        />
                        <p className="mt-2 text-xs text-gray-500">ID: {area.id}</p>
                    </div>
                    
                    {/* Footer - Hidden during print */}
                    <div className="flex justify-end p-4 border-t no-print">
                        <button 
                            onClick={onClose} 
                            className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md mr-2 hover:bg-gray-300"
                        >
                            Close
                        </button>
                        <button 
                            onClick={handlePrint} 
                            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                        >
                            Print
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
