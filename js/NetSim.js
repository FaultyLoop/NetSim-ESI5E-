class ObservedData {
	constructor (callback) {
		this.callback = callback ? callback: () => {}
		this._data = undefined
	}
	
	get data() {return this._data}
	set data(d) {
		this._data = d
		this.callback(d)
	}
}

class Node {
	constructor(name) {
		this.id = crypto.getRandomValues(new Uint8Array(8)).reduce((m,x) => {return m + ("0"+x.toString(16))})
		this.netint = Array.from({length: Math.floor(Math.random() * (6 - 2) + 2)}, (_) => new Interface(this.id))
		console.log(this.netint.length, name)
		this.name = name
		this.enabled = false
	}
}

class Link {
	constructor(source, target){
		this.source = source
		this.target = target
		this.value = 10
	}
}

class Interface {
	constructor(id) {
		this.link = new Link(id, undefined)
		this.speed = Math.floor(Math.random() * 1e9)
		this.rfemi = Math.random()
	}
}

class Network {
	constructor (name) {
		this.name = name
		this.nodes = []
		this.links = []
	}
}

/*** Utils ***/
function fdr(f, d) {
	var r = new FileReader()
	r.onload = function(e) {d.data = e.target.result};
	r.readAsText(f);
}

function fdw(f, d) {
	var e = document.createElement('a');
    e.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(d.data))
    e.setAttribute('download', f);
    e.click();
}

function mkl(d, s, t) {
	if (s == t) return false
	try {
		s.netint.every(
			(x) => {
				if (x.link.target == t.id) throw new Exception("break")
			}
		)
		t.netint.forEach(
			(x) => {
				if (x.link.target == s.id) throw new Exception("break")
			}
		)
		
		s.netint.forEach(
			(y) => {
				if (y.link.target == undefined) {
						t.netint.forEach(
						(x) => {
							if (x.link.target == undefined) {
								x.link.target = s.id
								y.link.target = t.id
								d.links.push(x.link)
								d.links.push(y.link)
								throw new Exception("break")
							}
						}	
					)
				}
			}
		)
	} catch (e) {return true}
	return false
}

function rml(d, s, t) {
	if (s == t) return
	s.netint.forEach( 
		(i) => {
			if (i.link.target == t.id) {
				i.link.target = undefined
				d.links.remove(i.link)
			}
		}
	)
	t.netint.forEach(
		(i) => {
			if (i.link.target == s.id) {
				i.link.target = undefined
				d.links.remove(i.link)
			}
		}
	)
}

/*** NetSim Main function ***/
function loadNetwork() {
	this.data = new ObservedData(
		(d) => {
			localStorage.network = d
			localStorage.requpdt = 1
		}
	)
	var i = document.createElement("input")
	i.type = "file"
	i.onchange = (e) => {fdr(e.target.files[0], this.data)}
	i.click()
}

function saveNetwork() {
	var d = new ObservedData()
	var f = prompt("Save as :")
	if (f == null) return;
	d.data = localStorage.network ?? "[]"
	fdw(f+".json", d)
}

function randNetwork() {
	var m = Math.min(Math.max(localStorage.maxNodes ?? 16, 16),   16)
	var n = Math.min(Math.max(Math.floor(Math.random()*m),  4),    m)
	var d = new Network("randomized")
	d.nodes = Array.from({length:n}, (_,i) => new Node("Node_"+i))
	forceInterface(d.nodes[0], d.nodes.length - 1)
	
	d.nodes.forEach(
		(s) => {
			d.nodes.forEach(
				(t) => {
					if (s == t) return true
					if (Math.random() > .5) return true
					var l = mkl(d, s, t)
					if (l) console.log("Linking",s.name,t.name)
				}
			)
		}
	)
	
	localStorage.network = JSON.stringify(d)
	localStorage.requpdt = 1
}

function specNetwork(nodes, name, alwayR0 = false) {
	var d = new Network(name ?? "default")
	d.nodes = Array.from({length:nodes}, (_,i) => new Node("Node_"+i))
	if (alwayR0) forceInterface(d.nodes[0], d.nodes.length - 1)
		
	localStorage.network = JSON.stringify(d)
	localStorage.requpdt = 1

}

function forceInterface(n, i) {
	n.netint = Array.from({length: i}, (_) => new Interface(n.id))
}

function chgNodeStatus(e) {
	localStorage.locknet = 1
	var t = e.children[1].__data__
	var d = JSON.parse(localStorage.network)
	var n = d.nodes.findIndex((i) => {return i.name == t.name})
	e.children[1].__data__.enabled = !e.children[1].__data__.enabled
	d.nodes[n].enabled = !d.nodes[n].enabled
	localStorage.network = JSON.stringify(d)
	localStorage.requpdt = 1
	localStorage.locknet = 0
}

function draw(force) {
	if (!force && localStorage.requpdt == 0) {return}
	localStorage.requpdt = 0
	var d = localStorage.network
	if (!d) return d3.select("#info").text("Please Generate or Load a Network Configuration")
	d = JSON.parse(d) ?? []
	if (d.length == 0) return d3.select("#info").text("Empty Network")
	
	d3.selectAll("svg > *").remove()
	var m = d3.select("svg")
	var w = m.attr("width")
    var h = m.attr("height")
	var s = d3.forceSimulation()
			  .force("link", d3.forceLink().id((d) => {return d.id;}))
              .force("charge", d3.forceManyBody().strength(-400))
              .force("center", d3.forceCenter(w>>1, h>>1))
	var l = m.append("g")
		     .attr("class", "links")
		     .selectAll("line")
		     .data(d.links)
		     .enter()
			 .append("line")
		     .attr("stroke-width", 5)
	var n = m.append("g")
		     .attr("class", "nodes")
		     .selectAll("g")
		     .data(d.nodes)
		     .enter()
			 .append("g")
			 .attr("onclick","chgNodeStatus(this)")
	n.append("circle")
	 .attr("r", 32)
     .attr("fill", (d) => {console.log(d);return d.enabled ? "lightgreen":"red"})
	n.append("text")
     .text((d) => {return d.name})
	 .attr('x', -24)
	 .attr('y', -4)
	var cb = d3.drag()
	           .on("start", (d) => {!d3.event.active && s.alphaTarget(0.3).restart();d.fx = d.x ?? 25;d.fy = d.y ?? 25})
		       .on("drag" , (d) => {d.fx = d.x ?? 0;d.fy = d.y})
		       .on("end"  , (d) => {!d3.event.active && s.alphaTarget(0);d.fx = null;d.fy = d.y})
	cb(n)
	
	s.nodes(d.nodes)
	 .on("tick", () => {
		if (localStorage.locknet == 1) return
		d = JSON.parse(localStorage.network)
		n.attr("_", (e) => {
				var i = d.nodes.findIndex((t) => {return e.id == t.id})
				d.nodes[i] = e
			}
		)
		n.attr("transform", (e) => {return "translate("+e.x+","+e.y+")"})
		
		try {
			l.attr("x1", (e) => {return d.nodes.find((t) => {return e.source == t.id}).x})
			 .attr("y1", (e) => {return d.nodes.find((t) => {return e.source == t.id}).y})
			 .attr("x2", (e) => {return d.nodes.find((t) => {return e.target == t.id}).x})
			 .attr("y2", (e) => {return d.nodes.find((t) => {return e.target == t.id}).y})
		} catch (error) {}
		localStorage.network = JSON.stringify(d)
	 }
	)
	s.force("link").links(d.links)

	console.log("ok")
}

/*** Setup & Startup ***/
function getUpdate() {return localStorage.update}
function setUpdate(delay) {
	localStorage.requpdt = 1
	clearInterval(localStorage.update)
	localStorage.update = setInterval(() => {draw()}, Math.max(Math.min(1e5, delay ?? 0), 50))
}

function sendMsg(source, target) {
	var m = JSON.parse(localStorage.network)
	var s = m.nodes.find((n) => {return n.id == source || n.name == source})
	var t = m.nodes.find((n) => {return n.id == target || n.name == target})
	if (!s || !t) return
	
}
/*** Update Loop ***/
(() => {setUpdate(250)})()