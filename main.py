#!/usr/bin/python3
#-*- coding:UTF-8 -*-

from network import Network
import tkinter as tk
import tkinter.messagebox as msgbox
import tkinter.filedialog as filepr
import threading


class GUI:
    def __init__(self):
        self.root = tk.Tk(screenName="NetSim", className="NetSim")
        self._canvas = tk.Canvas(master=self.root)
        self._canvas.pack()
        self._rthread = threading.Thread(target=self.root.mainloop)
        self.root.bind("<F5>", self.update)
        self.root.bind("<Control-s>", self.save)
        self.root.bind("<Control-l>", self.load)
        self.root.bind("<Control-g>", self.generate)
        self._rthread.run()
        self.lastSave = "default"

    def update(self, *event):
        print("ok !")

    def generate(self, *event):
        pass

    def save(self, *event):
        filename = filepr.asksaveasfilename()
        if filename == None: return
        print(filename)

    def load(self, *event):
        filename = filepr.askopenfilename()
        if filename == None: return
        print(filename)



if __name__ == '__main__':
    main = GUI()
