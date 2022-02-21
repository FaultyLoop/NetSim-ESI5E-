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
		this.name = name
		this.enabled = true
	}
}

class Link {
	constructor(source, target){
		this.source = source
		this.target = target
		this.value = Math.floor(Math.random() * 100)
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
function fnt(n, i) {n.netint = Array.from({length: i}, (_) => new Interface(n.id))}

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

function dtf(d) {
	var o = {links:[], nodes:[]}
	d.links.forEach((e,i) => {o.links[i] = {source:e.source.id, target:e.target.id, value:e.value}})
	d.nodes.forEach((e,i) => {o.nodes[i] = {...e}})
	return o
}

/*** NetSim Main function ***/
function loadNetwork() {
	this.data = new ObservedData(
		(d) => {
			data = JSON.parse(d)
			localStorage.network = d
			init()
		}
	)
	var i = document.createElement("input")
	i.type = "file"
	i.onchange = (e) => {fdr(e.target.files[0], this.data)}
	i.click()
}
function saveNetwork() {
	var o = new ObservedData()
	var f = $("#netname").val()
	if ($.isEmptyObject(f)) f = prompt("Save as :")
	if (f == null) return;
	o.data = JSON.stringify(dtf(data))
	fdw(f+".json", o)
}
function randNetwork() {
	var m = $("#netnode").val()
	var n = Math.min(Math.max(m,  3), 32)
	var d = new Network("randomized")
	d.nodes = Array.from({length:n}, (_,i) => new Node("Node_"+i))
	fnt(d.nodes[0], d.nodes.length - 1)
	var o = []
	d.nodes.forEach(
		(s) => {
			do {
				d.nodes.forEach(
					(t) => {
						if (s == t) return true
						if (Math.floor(Math.random() * 100) > $("#linkChance").val()) return true
						var l = mkl(d, s, t)
						o.push(s.id)
						o.push(t.id)
						return false
					}
				)
			} while (!o.includes(s.id))
		}
	)

	data = d
	localStorage.network = JSON.stringify(d)
	init()
	tick()
}

function nameChange(o) {
  var c = o.selectionStart,
      r = /[^a-zA-Z0-9_]/gi,
      v = $(o).val();
  if(r.test(v)) {
    $(o).val(v.replace(r, ''));
    c--;
  }
  o.setSelectionRange(c, c);
	v = $(o).val()
	n = v
	c = 0
	$("#dsa-"+target.name).text(n)
	$("#dst-"+target.name).text(n)
	$("#dsa-"+target.name).prop("id", "dsa-"+n)
	$("#dst-"+target.name).prop("id", "dst-"+n)
	target.name = v
	tick()
}

function iniAlgo() {algos.forEach ((n) => {window[n] = new Function("return "+localStorage.getItem(n))()})}
function updAlgo() {
	$("#calgo").empty()
	algos.forEach((n) => {
		$("#calgo").append(
			"<div class='row pl-4'>"+
			"<button class='form-control btn-info pl-4 col-7' onclick=\"setAlgo(\'"+n+"\')\" style='color:red;'>"+n+"</button>"+
			"<button class='form-control btn-danger col-3' onclick=\"delAlgo(\'"+n+"\')\" >X</button>"+
			"</div>"
		)

	})
	localStorage.algos = JSON.stringify(algos)
}
function updList() {
	$("#source-node").empty()
	$("#target-node").empty()
	data.nodes.forEach(
		function (n) {
			$("#source-node").append("<option id='dsa-"+n.name+"'class='dropdown-item' style='color:black;'>"+n.name+"</option>")
			$("#target-node").append("<option id='dst-"+n.name+"'class='dropdown-item' style='color:black;'>"+n.name+"</option>")
		}
	)
}
function delAlgo(name) {
		delete algos[algos.indexOf(name)]
		algos = algos.filter(x => x);
		localStorage.removeItem(name)
		updAlgo()
}
/*** Network Simulation ***/
function customFunction(){
	var code = document.getElementById("customFunction").value
	if (!code.startsWith("async function")){
		alert("Fonction non async, veuillez corriger ")
		return
	}
	try {
		eval(code)
		var name = code.split(" ")[2].split("(")[0].trim()
		if (!algos.includes(name)) algos.push(name)
		localStorage.setItem(name, code)
		window[name] = new Function("return "+code)();
		setAlgo(name)
		updAlgo()
		$('#UserDefine').modal("hide")
	} catch (e) {
			alert(e)
	}
}

function setAlgo(n) {algo = n}
function getNodeById(i) {
	var e
	data.nodes.every(function (d) {e=d;return d.id != i})
	return e
}

async function djiska(n, t) {
		if (nodehist.includes(n.id) || !n.enabled) return false;
		if (n.id == t) return true;
		nodehist.push(n.id)
		var s =[]
		for (var i=0;i<n.netint.length;i++){
				var l = n.netint[i].link
				var tn = getNodeById(l.target)
				if (tn == undefined || nodehist.includes(l.target) || !tn.enabled) continue
				if (l.target == t) s.splice(0,0,[l,tn])
				else s.splice(l.value, 0, [l, tn])
		}
		for (var i=0;i<s.length;i++) {
			var l  = s[i][0]
			var tn = s[i][1]
			await drawTransfer(l.source, l.target)
			if (await djiska(tn,t)) return true;
			await drawTransfer(l.source, l.target, true)
		}
		return false;
}
async function btree(n, t) {
		if (nodehist.includes(n.id) || !n.enabled) return false;
		if (n.id == t) return true;
		nodehist.push(n.id)
		for (var i=0;i<n.netint.length;i++){
				var l = n.netint[i].link
				var tn = getNodeById(l.target)
				if (tn == undefined || nodehist.includes(l.target) || !tn.enabled) continue
				await drawTransfer(l.source, l.target)
				if (await btree(tn,t)) return true;
				await drawTransfer(l.source, l.target, true)
		}
		return false;
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
	if (localStorage.speed == undefined) localStorage.speed = 60
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
	tick()
}
async function simulate() {
	link.selectAll("line")
    	.attr("stroke", "red")
	var algof = algo
	nodehist = []
	if (algof == undefined || this[algof] == undefined) return
	var source = data.nodes[$("#source-node").prop("selectedIndex")]
	var target = data.nodes[$("#target-node").prop("selectedIndex")]
	if (source.id == target.id) return
	if (await this[algof](source, target.id)) $("#nodePathOK").modal("show")
	else $("#nodePathNOK").modal("show")
}

/*** Setup & Startup ***/
var svg        = undefined
var color      = undefined
var simulation = undefined
var link       = undefined
var node       = undefined
var name			 = undefined
var algo       = "btree"
var nodehist   = []
var algos      = JSON.parse(localStorage.algos   ?? "[]")
var data       = JSON.parse(localStorage.network ?? "[]")

function dragstarted(d) {
		 if (localStorage.nosimu == 1) return
		 if (!d3.event.active) simulation.alphaTarget(0.3).restart();
     d.fx = Math.max(CRCLRAD, Math.min(d.x, svg.attr("width")-CRCLRAD));
     d.fy = Math.max(CRCLRAD, Math.min(d.y, svg.attr("height")-CRCLRAD));
}
function dragged(d) {
		if (localStorage.nosimu == 1) return
	  d.fx = Math.max(CRCLRAD, Math.min(d3.event.x, svg.attr("width")-CRCLRAD));
	  d.fy = Math.max(CRCLRAD, Math.min(d3.event.y, svg.attr("height")-CRCLRAD));
}
function dragended(d) {
		if (localStorage.nosimu == 1) return
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
		localStorage.nosimu = 1
		updAlgo()
		updList()

		svg = d3.select("svg")
		if (simulation != undefined) {
			simulation.stop()
			$("#network").empty()
		}

		simulation = d3.forceSimulation()
									 .force("link"  , d3.forceLink().id(function(d) { return d.id; }))
									 .force("charge", d3.forceManyBody().strength(-800))
									 .force("center", d3.forceCenter(svg.attr("width")/2, svg.attr("height")/2));

		localStorage.nosimu = 0
  	d3.scaleOrdinal(d3.schemeCategory20);
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
			 		     .attr("class", "node")
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

/*** Other ***/
function Autosave(delay) {
	if (localStorage.autoSave == -1) return
	clearInterval(localStorage.autoSave)
	localStorage.autoSave = setInterval(() => {localStorage.network = JSON.stringify(dtf(data))}, Math.max(Math.min(1e5, delay ?? 0), 50))
}
function stopAutosave() {
	clearInterval(localStorage.autoSave)
	localStorage.autoSave = -1
	$("#autoSave").prop("disabled", true)
}
function startAutosave() {
	clearInterval(localStorage.autoSave)
	localStorage.autoSave = 0
	Autosave(parseFloat($("#autoSave").val()) * 1000)
	$("#autoSave").prop("disabled", false)
}
function toggleAutosave() {
	if (localStorage.autoSave == -1) {
		startAutosave()
	} else {
		stopAutosave()
	}
}

(() => {iniAlgo();init();Autosave(parseFloat($("#autoSave").val()) * 1000)})()
