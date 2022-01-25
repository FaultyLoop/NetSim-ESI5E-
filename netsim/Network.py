#!/usr/bin/python3
#-*- coding:UTF-8 -*-

from netsim.Node import Node
from netsim.Link import Link

import pickle
import random
import json

class Network:
    def __init__(self):
        self._netobj = {}

    def generate(self, size:int, classList: list = [Node],linkLimit = 3):
        for __, nodecls in enumerate(classList):
            if not isinstance(nodecls, Node.__class__):
                classList.remove(nodecls)

        if len(classList) == 0: return False
        self._netobj.clear()
        for i in range(size):
            netcls = random.choice(classList)
            netobj = netcls("{}_[{}]".format(netcls.__name__, i))
            self._netobj[netobj.name] = netobj
        self.randomLink()

    def randomLink(self):
        for netobj in self._netobj:
            netobj = self._netobj[netobj]
            for subobj in self._netobj:
                subobj = self._netobj[subobj]
                if subobj == netobj:continue
                if len(netobj._links) >= linkLimit or\
                   len(subobj._links) >= linkLimit:
                   break
                if random.getrandbits(2) & 0b11 == 0b11:
                    Link(netobj, subobj)

    def getSimpleMap(self, returnAsJson = False):
        map = {"nodes": [], "links": []}
        for netobj in self._netobj:
            netobj = self._netobj[netobj]
            map["nodes"].append(
                {
                    "id": id(netobj),
                    "name": netobj.name,
                    "group": 0
                }
            )
            for link in netobj._links:
                link = netobj._links[link]
                map["links"].append(
                    {
                        "source": id(link.origin),
                        "target": id(link.target),
                        "value": 10
                    }
                )
        return map if not returnAsJson else json.dumps(map)

    def save(self, filename:str):
        with open(filename, "wb") as fd:
            pickle.dump(self._netobj, fd)

    def load(self, filename:str):
        with open(filename, "rb") as fd:
            self._netobj = pickle.load(fd)
