param([string]$FilePath, [string]$PrinterName)

# Windows winspool RAW printing API — sends bytes directly to printer bypassing GDI
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
public struct DOCINFOW {
    [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
}

public class RawPrinterHelper {
    [DllImport("winspool.drv", CharSet=CharSet.Unicode, SetLastError=true)]
    public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);

    [DllImport("winspool.drv", CharSet=CharSet.Unicode, SetLastError=true)]
    public static extern int StartDocPrinter(IntPtr hPrinter, int Level, ref DOCINFOW pDocInfo);

    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool WritePrinter(IntPtr hPrinter, byte[] pBytes, int dwCount, out int dwWritten);

    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    public static bool SendBytesToPrinter(string printerName, byte[] bytes) {
        IntPtr hPrinter = IntPtr.Zero;
        if (!OpenPrinter(printerName, out hPrinter, IntPtr.Zero)) {
            Console.WriteLine("ERROR: OpenPrinter failed. Code=" + Marshal.GetLastWin32Error());
            return false;
        }

        var docInfo = new DOCINFOW {
            pDocName   = "POS Receipt",
            pOutputFile = null,
            pDataType  = "RAW"
        };

        if (StartDocPrinter(hPrinter, 1, ref docInfo) == 0) {
            Console.WriteLine("ERROR: StartDocPrinter failed. Code=" + Marshal.GetLastWin32Error());
            ClosePrinter(hPrinter);
            return false;
        }

        if (!StartPagePrinter(hPrinter)) {
            Console.WriteLine("ERROR: StartPagePrinter failed. Code=" + Marshal.GetLastWin32Error());
            EndDocPrinter(hPrinter);
            ClosePrinter(hPrinter);
            return false;
        }

        int written = 0;
        bool ok = WritePrinter(hPrinter, bytes, bytes.Length, out written);
        Console.WriteLine("WritePrinter: ok=" + ok + " written=" + written + "/" + bytes.Length);

        EndPagePrinter(hPrinter);
        EndDocPrinter(hPrinter);
        ClosePrinter(hPrinter);
        return ok;
    }
}
"@

# Read the binary file
$bytes = [System.IO.File]::ReadAllBytes($FilePath)
Write-Host "File: $FilePath ($($bytes.Length) bytes)"
Write-Host "Printer: $PrinterName"
Write-Host "Sending RAW bytes via winspool..."

$result = [RawPrinterHelper]::SendBytesToPrinter($PrinterName, $bytes)

if ($result) {
    Write-Host "PRINT_DONE"
} else {
    Write-Host "PRINT_FAILED"
    exit 1
}
