#!/usr/bin/python3
#-*- coding:UTF-8 -*-

import random
import json
import os
import pathlib

class Link:
    _links = []
    LINK_TYPE = {}

    def __init__(self, origin, target, isPair = False, linkRule = None, linkEmul = None):
        self.origin = origin
        self.target = target
        self.origin._links[id(target)] = self
        self.linkRule = linkRule if callable(linkRule) else self._linkRule
        self.emulateLink = linkEmul if callable(linkEmul) else self._linkEmul
        if len(Link.LINK_TYPE) == 0:
            parent = pathlib.Path(__file__).parent.parent.absolute().__str__()
            with open(parent+"/config/links.json", "r", encoding="utf-8") as rd:
                Link.LINK_TYPE = json.load(rd)
        if not isPair:
            pair = Link(target, origin, True)
        self._links.append(self)

    def _linkRule(self, message: dict):
        weight = message.get("weight", 0)
        if weight > 15: return False
        message["weight"] = weight + 1
        return True

    def _linkEmul(self, destination, message: dict):
        return destination

    def unlink(self):
        try:self.origin._links[id(self.target)]
        except:pass
        try:self.target._links[id(self.origin)]
        except:pass
        self._links.remove(self)

    def sendRemote(self, destination:str, message:dict):
        if not self.linkRule(message):return
        for link in self.target._links:
            link = self.target._links[link]
            link.recvRemote(destinationn, message)

    def recvRemote(self, destination:str, message:dict):
        if origin.name == destination:
            origin.recv(message)
        destination = self.emulateLink(destination, message)
        if self.target.name == destination:
            self.target.recv(message)
        else:
            self.sendRemote(destination, message)
