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
const CRCLRAD = 25
function slp(ms) {return new Promise(r => setTimeout(r, ms));}

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
	//TODO
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
	var f = $("#netname").val()
	if ($.isEmptyObject(f)) f = prompt("Save as :")
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

	data = d
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
	d.nodes[n].enabled = !d.nodes[n].enabled
	localStorage.network = JSON.stringify(d)
	localStorage.requpdt = 1
	localStorage.locknet = 0
}

function nameChange(n) {
	$("#dsa-"+target.name).text(n)
	$("#dst-"+target.name).text(n)
	$("#dsa-"+target.name).prop("id", "dsa-"+n)
	$("#dst-"+target.name).prop("id", "dst-"+n)
	target.name = n
	tick()
}

async function drawTransfer(source, target, cancel = false) {
	var coords = []
	var xindex = undefined
	var yindex = undefined
	if (cancel) source = [target, target = source][0]

	link.select(function(d) {
		if (d.source.id == source && d.target.id == target) {xindex = d.index;d.moving = true}
		if (d.source.id == target && d.target.id == source) {yindex = d.index;d.moving = true}
	})
	var pad = 0
	var links = $(".links").children()
	if (localStorage.speed == undefined) {
		localStorage.speed = 250
	}
	for (var i=2;pad<=80;i++) {
		var pad = Math.log(i) / Math.log(100) * 100
		var coords = [
			parseFloat(links[xindex].getAttribute("x1")),
			parseFloat(links[xindex].getAttribute("y1")),
			parseFloat(links[yindex].getAttribute("x1")),
			parseFloat(links[yindex].getAttribute("y1"))
		]
		if (localStorage.debug) {
			console.log("PAD",pad)
			console.log("BLUE")
			console.log("x2", coords[0] + ((coords[0] - coords[2]) / (100/pad)), coords[2])
			console.log("y2", coords[1] + ((coords[1] - coords[3]) / (100/pad)), coords[3])
			console.log("RED")
			console.log("x2", coords[2] + ((coords[2] - coords[0]) / (pad)), coords[0])
			console.log("y2", coords[3] + ((coords[3] - coords[1]) / (pad)), coords[1])
			console.log("------------------------------------------")
		}
		links[xindex].setAttribute("x2", coords[0] + ((coords[2] - coords[0]) / (100 / pad)))
		links[xindex].setAttribute("y2", coords[1] + ((coords[3] - coords[1]) / (100 / pad)))
		links[yindex].setAttribute("x2", coords[0] - ((coords[0] - coords[2]) / (100 / pad)))
		links[yindex].setAttribute("y2", coords[1] - ((coords[1] - coords[3]) / (100 / pad)))
		links[xindex].setAttribute("stroke", cancel ? "red":"lightblue")
		links[yindex].setAttribute("stroke", cancel ? "lightblue":"red")
		await slp(localStorage.speed)
	}
	links[yindex].setAttribute("stroke", "transparent")
	link.select(function(d) {
		if (d.source.id == source && d.target.id == target) {d.moving = false}
		if (d.source.id == target && d.target.id == source) {d.moving = false}
	})
}

function setAlgo(n) {name =n}

async function simulate() {
}

function customFunction(){
	var code = document.getElementById("customFunction").value
	console.log(code)
	if (!code.startsWith("async function")){
		alert("Fonction non async, veuillez corriger ")
		return
	}
	try {
		eval(code)
		name  = code.split(" ")[2].split("(")[0].trim()
		$('#UserDefine').modal("hide")
	} catch (e) {
			alert(e)
	}
}

function draw(force) {
	if (!force && localStorage.requpdt == 0) {return}
	data = JSON.parse(localStorage.network)
	init()
	localStorage.requpdt = 0
}

/*** Setup & Startup ***/
var svg        = undefined
var color      = undefined
var simulation = undefined
var link       = undefined
var node       = undefined
var name			 = undefined
var data       = JSON.parse(localStorage.network ?? "[]")

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
     d.fx = Math.max(CRCLRAD, Math.min(d.x, svg.attr("width")-CRCLRAD));
     d.fy = Math.max(CRCLRAD, Math.min(d.y, svg.attr("height")-CRCLRAD));
}
function dragged(d) {
	   d.fx = Math.max(CRCLRAD, Math.min(d3.event.x, svg.attr("width")-CRCLRAD));
	   d.fy = Math.max(CRCLRAD, Math.min(d3.event.y, svg.attr("height")-CRCLRAD));
}
function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
     d.fx = null;
     d.fy = null;
}

function tick() {
	if (localStorage.nosimu == 1) return
	link.attr("x1", function(d) {return Math.max(CRCLRAD, Math.min(d.source.x, svg.attr("width" )-CRCLRAD));})
		  .attr("y1", function(d) {return Math.max(CRCLRAD, Math.min(d.source.y, svg.attr("height")-CRCLRAD));})
		  .attr("x2", function(d) {if (d.moving) {return $(".links").children()[d.index].getAttribute("x2")}return Math.max(CRCLRAD, Math.min(d.target.x, svg.attr("width" )-CRCLRAD));})
	    .attr("y2", function(d) {if (d.moving) {return $(".links").children()[d.index].getAttribute("y2")}return Math.max(CRCLRAD, Math.min(d.target.y, svg.attr("height")-CRCLRAD));})
	node.attr("transform", function(d) {return "translate("+d.x+","+d.y+")";})
			.selectAll("circle")
			.attr("fill", function (d) {return d.enabled ? "#CCCCCC":"red"})
	node.selectAll("text")
			.text(function(d) {return d.name})
}

function init() {
	  if (simulation != undefined) {
			simulation.stop()
			d3.selectAll("svg > *").remove()
		}
		$("#start-dp").empty()
		$("#stop-dp").empty()
		data.nodes.forEach(
			function (n) {
				$("#start-dp").append("<option id='dsa-"+n.name+"'class='dropdown-item' style='color:black;'>"+n.name+"</option>")
				$("#stop-dp").append("<option id='dst-"+n.name+"'class='dropdown-item' style='color:black;'>"+n.name+"</option>")
			}
		)

		localStorage.nosimu = 0
	  svg = d3.select("svg")
  	color      = d3.scaleOrdinal(d3.schemeCategory20);
		simulation = d3.forceSimulation()
								   .force("link"  , d3.forceLink().id(function(d) { return d.id; }))
								   .force("charge", d3.forceManyBody().strength(-2000))
								   .force("center", d3.forceCenter(svg.attr("width")/2, svg.attr("height")/2));
		link = svg.append("g")
              .attr("class", "links")
					 		.selectAll("line")
					 		.data(data.links)
					 		.enter()
							.append("line")
					 		.attr("stroke-width", 5)
					 		.attr("stroke-linecap", "round")
							.attr("stroke", "red")

	  node = svg.append("g")
						 	 .attr("class", "nodes")
						 	 .selectAll("g")
						 	 .data(data.nodes)
						 	 .enter()
							 .append("g")
			 		     .attr("class", function (d) {return "node"})

	  node.append("circle")
		    .attr("r", CRCLRAD)

		$(".node").dblclick(
			function (e) {
				target = e.target.__data__
				$("#nodeInfo").modal().show()
				$("#nodeName").val(target.name)
				$("#nodeCheck").prop("checked",target.enabled)
			}
		)

	  var drag_handler = d3.drag()
											 	 .on("start", dragstarted)
											 	 .on("drag", dragged)
											 	 .on("end", dragended);
	  drag_handler(node);
	  var lables = node.append("text")
										 .text(function(d) {return d.name;})
									 	 .attr('x', -CRCLRAD>>1)
									 	 .attr('y', CRCLRAD>>2);
	  simulation.nodes(data.nodes).on("tick", tick);
	  simulation.force("link").links(data.links);
}

function getUpdate() {return localStorage.update}
function setUpdate(delay) {
	localStorage.requpdt = 1
	clearInterval(localStorage.update)
	localStorage.update = setInterval(() => {draw()}, Math.max(Math.min(1e5, delay ?? 0), 50))
}

/*** Update Loop ***/
(() => {init();setUpdate(250)})()
