import javafx.application.Application;
import javafx.application.Platform;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.Stage;

import java.io.*;

public class BotManagerApp extends Application {

    private TextArea consoleArea = new TextArea();
    private TextArea fileEditor = new TextArea();
    private Process botProcess;

    @Override
    public void start(Stage primaryStage) {
        Button startBtn = new Button("Start Bot");
        Button stopBtn = new Button("Stop Bot");
        Button loadFileBtn = new Button("Load Config");
        Button saveFileBtn = new Button("Save Config");

        startBtn.setOnAction(e -> startBot());
        stopBtn.setOnAction(e -> stopBot());
        loadFileBtn.setOnAction(e -> loadConfigFile());
        saveFileBtn.setOnAction(e -> saveConfigFile());

        HBox buttons = new HBox(10, startBtn, stopBtn, loadFileBtn, saveFileBtn);
        buttons.setPadding(new Insets(10));

        consoleArea.setEditable(false);
        consoleArea.setStyle("-fx-control-inner-background: black; -fx-font-family: monospace; -fx-highlight-fill: green; -fx-highlight-text-fill: black; -fx-text-fill: green;");

        fileEditor.setStyle("-fx-font-family: monospace;");

        SplitPane splitPane = new SplitPane(consoleArea, fileEditor);
        splitPane.setDividerPositions(0.6);

        VBox root = new VBox(buttons, splitPane);

        Scene scene = new Scene(root, 800, 600);

        primaryStage.setTitle("Discord Bot Manager");
        primaryStage.setScene(scene);
        primaryStage.show();
    }

    private void startBot() {
        if (botProcess != null && botProcess.isAlive()) {
            appendConsole("Bot is already running.\n");
            return;
        }

        try {
            ProcessBuilder pb = new ProcessBuilder("node", "../index.js");
            pb.directory(new File(".")); // dossier courant
            pb.redirectErrorStream(true);
            botProcess = pb.start();

            appendConsole("Bot started.\n");

            // Lire la sortie du bot en thread séparé
            new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(botProcess.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        String finalLine = line;
                        Platform.runLater(() -> appendConsole(finalLine + "\n"));
                    }
                } catch (IOException ex) {
                    Platform.runLater(() -> appendConsole("Error reading bot output: " + ex.getMessage() + "\n"));
                }
            }).start();

            // Surveiller la fin du process
            new Thread(() -> {
                try {
                    int exitCode = botProcess.waitFor();
                    Platform.runLater(() -> appendConsole("Bot exited with code " + exitCode + "\n"));
                } catch (InterruptedException e) {
                    Platform.runLater(() -> appendConsole("Bot process interrupted.\n"));
                }
            }).start();

        } catch (IOException e) {
            appendConsole("Failed to start bot: " + e.getMessage() + "\n");
        }
    }

    private void stopBot() {
        if (botProcess != null && botProcess.isAlive()) {
            botProcess.destroy();
            appendConsole("Bot stopped.\n");
        } else {
            appendConsole("Bot is not running.\n");
        }
    }

    private void appendConsole(String text) {
        consoleArea.appendText(text);
    }

    private void loadConfigFile() {
        File file = new File("bot/config.json");
        if (!file.exists()) {
            appendConsole("Config file not found: bot/config.json\n");
            return;
        }
        try (BufferedReader br = new BufferedReader(new FileReader(file))) {
            StringBuilder content = new StringBuilder();
            String line;
            while((line = br.readLine()) != null){
                content.append(line).append("\n");
            }
            fileEditor.setText(content.toString());
            appendConsole("Config loaded.\n");
        } catch (IOException e) {
            appendConsole("Error loading config: " + e.getMessage() + "\n");
        }
    }

    private void saveConfigFile() {
        File file = new File("bot/config.json");
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(file))) {
            bw.write(fileEditor.getText());
            appendConsole("Config saved.\n");
        } catch (IOException e) {
            appendConsole("Error saving config: " + e.getMessage() + "\n");
        }
    }

    public static void main(String[] args) {
        launch(args);
    }
}
