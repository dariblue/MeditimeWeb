let tomas = [

{nombre:"Paracetamol", dosis:"500mg", hora:"14:00", tomado:false},
{nombre:"Ibuprofeno", dosis:"600mg", hora:"15:30", tomado:false},
{nombre:"Omeprazol", dosis:"20mg", hora:"20:00", tomado:false}
    
]


function minutosDiff(hora){

const ahora = new Date()

const [h,m] = hora.split(":")

const toma = new Date()

toma.setHours(h)
toma.setMinutes(m)
toma.setSeconds(0)

return Math.floor((ahora - toma)/60000)

}


function calcularEstado(toma){

if(toma.tomado) return "completada"

const diff = minutosDiff(toma.hora)

if(diff < 0) return "proxima"

if(diff <= 60) return "pendiente"

return "atrasada"

}


function tiempoRestante(hora){

const diff = minutosDiff(hora)

if(diff < 0){

const mins = Math.abs(diff)

if(mins > 60){

const h = Math.floor(mins/60)

return "En "+h+"h"

}

return "En "+mins+" min"

}

if(diff <= 60){

return "Hace "+diff+" min"

}

return "Retraso "+diff+" min"

}


function ordenarTomas(){

const prioridad = {

"atrasada":0,
"pendiente":1,
"proxima":2,
"completada":3

}

tomas.sort((a,b)=>{

const ea = calcularEstado(a)
const eb = calcularEstado(b)

return prioridad[ea] - prioridad[eb]

})

}


function actualizarProgreso(){

const total = tomas.length

const hechas = tomas.filter(t=>t.tomado).length

const porcentaje = (hechas/total)*100

document.getElementById("barra-progreso").style.width = porcentaje+"%"

document.getElementById("texto-progreso").innerText =
hechas+" / "+total+" tomas realizadas"

}


function render(){

ordenarTomas()

const container = document.getElementById("tomas-hoy-container")

container.innerHTML=""

tomas.forEach((toma,i)=>{

const estado = calcularEstado(toma)

const card = document.createElement("div")

card.className="toma-card toma-"+estado

card.innerHTML=`

<div class="toma-info">

<div class="toma-hora">${toma.hora}</div>

<div class="toma-medicamento">
${toma.nombre} · ${toma.dosis}
</div>

<div class="tiempo-restante">
${tiempoRestante(toma.hora)}
</div>

</div>

<button class="confirmar-btn"
${estado==="proxima" || estado==="completada" ? "disabled":""}>
${estado==="completada" ? "Tomado":"Confirmar"}
</button>

`

const btn = card.querySelector("button")

btn.onclick=()=>{

toma.tomado=true

card.style.transform="scale(0.95)"

setTimeout(()=>{

render()

},150)

}

container.appendChild(card)

})

actualizarProgreso()

}


render()

setInterval(render,60000)