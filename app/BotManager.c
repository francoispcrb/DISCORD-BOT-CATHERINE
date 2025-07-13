#include <windows.h>
#include <stdio.h>
#include <stdlib.h>

#define IDC_START 101
#define IDC_STOP 102
#define IDC_CONSOLE 103

HWND hConsole;
PROCESS_INFORMATION pi = {0};
HANDLE hChildStd_OUT_Rd = NULL;
HANDLE hChildStd_OUT_Wr = NULL;
HANDLE hOutputThread = NULL;
char consoleBuffer[10000] = {0};

DWORD WINAPI ReadOutputThread(LPVOID lpParam) {
    char buf[256];
    DWORD dwRead;
    while (ReadFile(hChildStd_OUT_Rd, buf, sizeof(buf)-1, &dwRead, NULL) && dwRead > 0) {
        buf[dwRead] = '\0';
        // Append text to the console (in GUI thread)
        PostMessage(hConsole, WM_APP + 1, (WPARAM)strdup(buf), 0);
    }
    return 0;
}

LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch(msg) {
    case WM_CREATE: {
        CreateWindow("BUTTON", "Start Bot", WS_VISIBLE | WS_CHILD,
                     10, 10, 100, 30, hwnd, (HMENU)IDC_START, NULL, NULL);
        CreateWindow("BUTTON", "Stop Bot", WS_VISIBLE | WS_CHILD,
                     120, 10, 100, 30, hwnd, (HMENU)IDC_STOP, NULL, NULL);
        hConsole = CreateWindowEx(WS_EX_CLIENTEDGE, "EDIT", "",
                                 WS_CHILD | WS_VISIBLE | WS_VSCROLL | ES_MULTILINE | ES_AUTOVSCROLL | ES_READONLY,
                                 10, 50, 480, 300, hwnd, (HMENU)IDC_CONSOLE, NULL, NULL);
        break;
    }
    case WM_COMMAND: {
        switch(LOWORD(wParam)) {
        case IDC_START: {
            if (pi.hProcess != NULL) {
                MessageBox(hwnd, "Bot is already running.", "Info", MB_OK);
                break;
            }
            SECURITY_ATTRIBUTES saAttr;
            saAttr.nLength = sizeof(SECURITY_ATTRIBUTES);
            saAttr.bInheritHandle = TRUE;
            saAttr.lpSecurityDescriptor = NULL;

            // Create pipe for stdout
            if (!CreatePipe(&hChildStd_OUT_Rd, &hChildStd_OUT_Wr, &saAttr, 0)) {
                MessageBox(hwnd, "Failed to create pipe.", "Error", MB_OK);
                break;
            }
            SetHandleInformation(hChildStd_OUT_Rd, HANDLE_FLAG_INHERIT, 0);

            STARTUPINFO si;
            ZeroMemory(&si, sizeof(si));
            si.cb = sizeof(si);
            si.dwFlags = STARTF_USESTDHANDLES;
            si.hStdOutput = hChildStd_OUT_Wr;
            si.hStdError = hChildStd_OUT_Wr;
            si.hStdInput = NULL;

            // Commande à lancer
            // Assure-toi que node.exe est dans PATH et que bot/index.js existe
            if (!CreateProcess(NULL,
                "node bot\\index.js",
                NULL, NULL, TRUE,
                0, NULL, NULL,
                &si, &pi)) {
                MessageBox(hwnd, "Failed to start bot process.", "Error", MB_OK);
                CloseHandle(hChildStd_OUT_Rd);
                CloseHandle(hChildStd_OUT_Wr);
                break;
            }
            CloseHandle(hChildStd_OUT_Wr);

            // Start thread to read stdout pipe
            hOutputThread = CreateThread(NULL, 0, ReadOutputThread, NULL, 0, NULL);
            break;
        }
        case IDC_STOP: {
            if (pi.hProcess != NULL) {
                TerminateProcess(pi.hProcess, 0);
                CloseHandle(pi.hProcess);
                CloseHandle(pi.hThread);
                pi.hProcess = NULL;
                pi.hThread = NULL;

                if (hChildStd_OUT_Rd) {
                    CloseHandle(hChildStd_OUT_Rd);
                    hChildStd_OUT_Rd = NULL;
                }
                if (hOutputThread) {
                    CloseHandle(hOutputThread);
                    hOutputThread = NULL;
                }

                MessageBox(hwnd, "Bot stopped.", "Info", MB_OK);
            } else {
                MessageBox(hwnd, "Bot is not running.", "Info", MB_OK);
            }
            break;
        }
        }
        break;
    }
    case WM_APP + 1: {
        // Append text to console
        char* text = (char*)wParam;
        int len = GetWindowTextLength(hConsole);
        SendMessage(hConsole, EM_SETSEL, (WPARAM)len, (LPARAM)len);
        SendMessage(hConsole, EM_REPLACESEL, FALSE, (LPARAM)text);
        free(text);
        break;
    }
    case WM_DESTROY:
        PostQuitMessage(0);
        break;
    default:
        return DefWindowProc(hwnd, msg, wParam, lParam);
    }
    return 0;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrev, LPSTR lpCmdLine, int nCmdShow) {
    WNDCLASS wc = {0};
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = "BotManagerWindowClass";
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW+1);

    RegisterClass(&wc);

    HWND hwnd = CreateWindow(wc.lpszClassName, "Discord Bot Manager", WS_OVERLAPPEDWINDOW | WS_VISIBLE,
                             CW_USEDEFAULT, CW_USEDEFAULT, 520, 400, NULL, NULL, hInstance, NULL);

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    return 0;
}
