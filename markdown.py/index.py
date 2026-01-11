import sys
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QTextEdit, QAction, QFileDialog,
    QMessageBox, QToolBar
)
from PyQt5.QtGui import QIcon, QKeySequence, QTextCursor, QTextCharFormat, QFont
from PyQt5.QtCore import Qt
from markdownify import markdownify as md 


class MarkdownEditor(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Éditeur Markdown (Pro)")
        self.setGeometry(100, 100, 900, 600)

        self.text_edit = QTextEdit()
        self.setCentralWidget(self.text_edit)

        toolbar = QToolBar("Outils")
        self.addToolBar(toolbar)

        bold_action = QAction(QIcon(), "Gras", self)
        bold_action.setShortcut(QKeySequence.Bold)
        bold_action.triggered.connect(self.set_bold)
        toolbar.addAction(bold_action)

        italic_action = QAction(QIcon(), "Italique", self)
        italic_action.setShortcut(QKeySequence.Italic)
        italic_action.triggered.connect(self.set_italic)
        toolbar.addAction(italic_action)

        h1_action = QAction("Titre 1", self)
        h1_action.triggered.connect(lambda: self.set_heading(1))
        toolbar.addAction(h1_action)

        h2_action = QAction("Titre 2", self)
        h2_action.triggered.connect(lambda: self.set_heading(2))
        toolbar.addAction(h2_action)

        bullet_action = QAction("Liste à puces", self)
        bullet_action.triggered.connect(self.insert_bullet_list)
        toolbar.addAction(bullet_action)

        file_menu = self.menuBar().addMenu("Fichier")

        export_action = QAction("Exporter en Markdown", self)
        export_action.triggered.connect(self.export_markdown)
        file_menu.addAction(export_action)

    def set_bold(self):
        fmt = QTextCharFormat()
        fmt.setFontWeight(QFont.Bold)
        self.merge_format(fmt)

    def set_italic(self):
        fmt = QTextCharFormat()
        fmt.setFontItalic(True)
        self.merge_format(fmt)

    def set_heading(self, level):
        cursor = self.text_edit.textCursor()
        cursor.select(QTextCursor.BlockUnderCursor)
        text = cursor.selectedText()
        cursor.removeSelectedText()
        cursor.insertText(f"<h{level}>{text}</h{level}>")

    def insert_bullet_list(self):
        cursor = self.text_edit.textCursor()
        cursor.insertHtml("<ul><li>Élément</li></ul>")

    def merge_format(self, fmt):
        cursor = self.text_edit.textCursor()
        if not cursor.hasSelection():
            cursor.select(QTextCursor.WordUnderCursor)
        cursor.mergeCharFormat(fmt)

    def export_markdown(self):
        """Exporte le contenu HTML vers du Markdown"""
        html_content = self.text_edit.toHtml()
        markdown_content = md(html_content)

        file_path, _ = QFileDialog.getSaveFileName(
            self, "Exporter en Markdown", "", "Markdown Files (*.md)"
        )
        if file_path:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(markdown_content)
            QMessageBox.information(self, "Exporté", f"Fichier sauvegardé : {file_path}")
        else:
            QMessageBox.information(self, "Markdown généré", markdown_content)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    editor = MarkdownEditor()
    editor.show()
    sys.exit(app.exec_())
