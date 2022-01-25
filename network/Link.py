#!/usr/bin/python3
#-*- coding:UTF-8 -*-

import random
import json
class Link:
    _links = []
    def __init__(self, origin, target):
        self.origin = origin
        self.target = target
        origin._links.[id(target)] = self
        target._links.[id(origin)] = self

    def sendMessage(self, target:str, message:str):
        pass
