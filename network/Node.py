#!/usr/bin/python3
#-*- coding:UTF-8 -*-

from network.Link import Link
import asyncio
import random

class Node:
    _nodes = {}
    NAMEUPDATE = "nameUpdate"

    def __init__(self, name, type = "", **kwds):
        #Preset
        self._isDead = kwds.get("deadNode", False)

        #Local Nodes / Links
        self._links = []
        self._nodes = []

        #Define Random Network Value
        self._address = random.randint((1 << 32) + 1 , (1 << 33) - 2)
        self.name = name

    @property
    def name(self):
        """
            Get the Node Name
        """
        return self._name.split("\\")[0]

    @name.setter
    def name(self, name: str):
        """
            Set the Node name, a random ID is given to handle name conflict
        """
        if self._isDead: return
        rid = hex(random.randint(0, 1<<24))[2:]
        name = name + "\\" + rid
        if hasattr(self, "_name"):
            Node._nodes[name] = Node._nodes[self.name]
            del Node._nodes[self.name]
        else:
            Node._nodes[name] = self
        self._name = name
        for link in self._links:
            link.updateRemote(Node.NAMEUPDATE)





















        #
