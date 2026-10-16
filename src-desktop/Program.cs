using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace PosteDeControle
{
    static class Program
    {
        private static Process serverProcess = null;

        [STAThread]
        static void Main()
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string serverScript = Path.Combine(baseDir, @"server\start-ui-server.ps1");

                if (!File.Exists(serverScript))
                {
                    // Fallback to parent directory if in subfolder
                    DirectoryInfo parentInfo = Directory.GetParent(baseDir);
                    string parent = parentInfo != null ? parentInfo.FullName : null;
                    if (parent != null)
                    {
                        string test = Path.Combine(parent, @"server\start-ui-server.ps1");
                        if (File.Exists(test))
                        {
                            baseDir = parent;
                            serverScript = test;
                        }
                    }
                }

                // 1. Demarrage silencieux du serveur PowerShell en arriere-plan (zero fenetre noire)
                bool isServerAlreadyRunning = CheckServerOnline("http://127.0.0.1:8765/api/status");
                if (!isServerAlreadyRunning && File.Exists(serverScript))
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = "powershell.exe";
                    psi.Arguments = string.Format("-NoProfile -ExecutionPolicy Bypass -File \"{0}\" -NoBrowser", serverScript);
                    psi.WorkingDirectory = baseDir;
                    psi.WindowStyle = ProcessWindowStyle.Hidden;
                    psi.CreateNoWindow = true;
                    psi.UseShellExecute = false;

                    serverProcess = Process.Start(psi);

                    // Attendre que le serveur reponde
                    for (int i = 0; i < 20; i++)
                    {
                        Thread.Sleep(300);
                        if (CheckServerOnline("http://127.0.0.1:8765/api/status"))
                        {
                            break;
                        }
                    }
                }

                // 2. Recherche du binaire Microsoft Edge pour le mode Application native standalone
                string edgePath = FindEdgeBinary();
                string appUrl = "http://127.0.0.1:8765/";

                if (!string.IsNullOrEmpty(edgePath) && File.Exists(edgePath))
                {
                    ProcessStartInfo edgePsi = new ProcessStartInfo();
                    edgePsi.FileName = edgePath;
                    edgePsi.Arguments = string.Format("--app=\"{0}\" --window-size=1260,840 --app-id=PosteDeControleSysAdmin", appUrl);
                    edgePsi.UseShellExecute = false;

                    Process edgeProc = Process.Start(edgePsi);
                    if (edgeProc != null)
                    {
                        edgeProc.WaitForExit();
                    }
                }
                else
                {
                    // Fallback sur le navigateur par defaut si Edge n'est pas trouve
                    Process.Start(appUrl);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Une erreur est survenue lors du demarrage :\n" + ex.Message,
                    "Poste de Controle Systeme",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning
                );
            }
            finally
            {
                // Nettoyage propre a la fermeture de l'application
                CleanupServer();
            }
        }

        private static bool CheckServerOnline(string url)
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                req.Timeout = 800;
                req.Method = "GET";
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    return resp.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }

        private static string FindEdgeBinary()
        {
            string[] candidates = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe")
            };

            foreach (string p in candidates)
            {
                if (File.Exists(p)) return p;
            }
            return null;
        }

        private static void CleanupServer()
        {
            try
            {
                if (serverProcess != null && !serverProcess.HasExited)
                {
                    serverProcess.Kill();
                    serverProcess.Dispose();
                }
            }
            catch { }
        }
    }
}
