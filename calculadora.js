

const configuraciones = {
    lineal: [
        ["a", "Coeficiente a", 2],
        ["b", "Término b", 5]
    ],
    cuadratica: [
        ["a", "Coeficiente a", 1],
        ["b", "Coeficiente b", -5],
        ["c", "Término c", 6]
    ],
    racional: [
        ["a", "Numerador a", 1],
        ["b", "Numerador b", -1],
        ["c", "Numerador c", -2],
        ["d", "Denominador d", 1],
        ["e", "Denominador e", -3]
    ],
    absoluto: [
        ["a", "Coeficiente a", 2],
        ["b", "Término b", 5],
        ["c", "Número derecho", 9]
    ]
};

const tipo = document.getElementById("tipo");
const campos = document.getElementById("campos");
const resultado = document.getElementById("resultado");
const pasos = document.getElementById("pasos");
const signo = document.getElementById("signo");

function crearCampos() {
    campos.innerHTML = "";

    configuraciones[tipo.value].forEach(([id, nombre, valor]) => {
        const div = document.createElement("div");
        div.innerHTML = `
            <label for="${id}">${nombre}</label>
            <input id="${id}" type="number" step="any" value="${valor}">
        `;
        campos.appendChild(div);
    });
}

tipo.addEventListener("change", crearCampos);
crearCampos();

function obtener(id) {
    const n = Number(document.getElementById(id).value);
    if (!Number.isFinite(n)) {
        throw new Error("Introduce coeficientes válidos.");
    }
    return n;
}

function raicesLineales(a,b) {
    if (Math.abs(a) < 1e-10) return [];
    return [-b/a];
}

function raicesCuadraticas(a,b,c) {
    if (Math.abs(a) < 1e-10) {
        return raicesLineales(b,c);
    }

    const d = b*b - 4*a*c;

    if (d < -1e-10) return [];

    if (Math.abs(d) < 1e-10) {
        return [-b/(2*a)];
    }

    const s = Math.sqrt(d);
    const q = -0.5 * (b + (b >= 0 ? s : -s));

    return [q/a, c/q];
}

function comparar(v, operador) {
    switch(operador) {
        case ">": return v > 1e-9;
        case ">=": return v >= -1e-9;
        case "<": return v < -1e-9;
        case "<=": return v <= 1e-9;
        case "=": return Math.abs(v) <= 1e-9;
        case "!=": return Math.abs(v) > 1e-9;
    }
}

function formato(n) {
    if (n === Infinity) return "∞";
    if (n === -Infinity) return "-∞";
    if (Math.abs(n) < 1e-9) return "0";
    return Number(n.toPrecision(7)).toString();
}

function calcularIntervalos(f, criticos, operador, polos) {
    const puntos = [...new Set(criticos)].sort((a,b)=>a-b);
    const limites = [-Infinity, ...puntos, Infinity];
    let intervalos = [];

    for(let i=0; i<limites.length-1; i++) {
        const izq = limites[i];
        const der = limites[i+1];

        let prueba;

        if(izq === -Infinity && der === Infinity) {
            prueba = 0;
        } else if(izq === -Infinity) {
            prueba = der - Math.max(1, Math.abs(der)+1);
        } else if(der === Infinity) {
            prueba = izq + Math.max(1, Math.abs(izq)+1);
        } else {
            prueba = izq + (der-izq)/2;
        }

        if(comparar(f(prueba), operador)) {
            intervalos.push({
                izq, der,
                cerradoIzq:false,
                cerradoDer:false
            });
        }
    }

    // Revisar puntos críticos: los polos nunca se incluyen.
    puntos.forEach(x => {
        if(polos.some(p=>Math.abs(p-x)<1e-8)) return;

        if(comparar(f(x), operador)) {
            intervalos.push({
                izq:x, der:x,
                cerradoIzq:true,
                cerradoDer:true
            });
        }
    });

    return unir(intervalos);
}

function unir(lista) {
    lista.sort((a,b)=>a.izq-b.izq);

    const salida=[];

    lista.forEach(v=>{
        const u=salida[salida.length-1];

        if(u && (
            v.izq < u.der ||
            (v.izq === u.der &&
            (u.cerradoDer || v.cerradoIzq))
        )) {
            if(v.der > u.der) {
                u.der=v.der;
                u.cerradoDer=v.cerradoDer;
            } else if(v.der === u.der) {
                u.cerradoDer ||= v.cerradoDer;
            }
        } else {
            salida.push({...v});
        }
    });

    return salida;
}

function escribirIntervalos(intervalos) {
    if(!intervalos.length) return "∅";

    return intervalos.map(v => {
        const izq = v.izq === -Infinity ? "-∞" : formato(v.izq);
        const der = v.der === Infinity ? "∞" : formato(v.der);

        return `${v.cerradoIzq?"[":"("}${izq}, ${der}${v.cerradoDer?"]":")"}`;
    }).join(" ∪ ");
}

function resolver() {
    try {
        const t=tipo.value;
        const op=signo.value;

        let f, raices=[], polos=[];
        let descripcion="";

        if(t==="lineal") {
            const a=obtener("a");
            const b=obtener("b");

            f=x=>a*x+b;
            raices=raicesLineales(a,b);

            descripcion=`${a}x + (${b}) ${op} 0`;

        } else if(t==="cuadratica") {
            const a=obtener("a");
            const b=obtener("b");
            const c=obtener("c");

            f=x=>a*x*x+b*x+c;
            raices=raicesCuadraticas(a,b,c);

            descripcion=`${a}x² + (${b})x + (${c}) ${op} 0`;

        } else if(t==="racional") {
            const a=obtener("a");
            const b=obtener("b");
            const c=obtener("c");
            const d=obtener("d");
            const e=obtener("e");

            if(Math.abs(d)<1e-10 && Math.abs(e)<1e-10) {
                throw new Error("El denominador no puede ser cero.");
            }

            f=x=>(a*x*x+b*x+c)/(d*x+e);

            raices=raicesCuadraticas(a,b,c);
            polos=raicesLineales(d,e);

            descripcion=`(${a}x² + (${b})x + (${c})) / (${d}x + (${e})) ${op} 0`;

        } else {
            const a=obtener("a");
            const b=obtener("b");
            const c=obtener("c");

            f=x=>Math.abs(a*x+b)-c;

            if(Math.abs(a)>1e-10 && c>=0) {
                raices=[
                    (-c-b)/a,
                    (c-b)/a
                ];
            }

            descripcion=`|${a}x + (${b})| ${op} ${c}`;
        }

        raices=raices.filter(Number.isFinite)
            .filter((x,i,arr)=>arr.findIndex(y=>Math.abs(y-x)<1e-8)===i);

        const criticos=[...raices,...polos];

        const intervalos=calcularIntervalos(
            f,criticos,op,polos
        );

        const solucion=escribirIntervalos(intervalos);

        resultado.innerHTML=`
            <p><strong>Inecuación:</strong></p>
            <p>${descripcion}</p>
            <br>
            <p><strong>Conjunto solución:</strong></p>
            <div class="answer">${solucion}</div>
        `;

        const lista=[
            `Se plantea: ${descripcion}.`,
            `Se calculan las raíces: ${raices.length?raices.map(formato).join(", "):"No existen raíces reales."}.`,
            `Puntos críticos: ${criticos.length?criticos.map(formato).join(", "):"Ninguno"}.`,
            `Se analiza el signo de la expresión en cada intervalo.`,
            `La solución final es: ${solucion}.`
        ];

        if(polos.length) {
            lista.splice(3,0,
                `Se excluyen del dominio: ${polos.map(formato).join(", ")}.`
            );
        }

        pasos.innerHTML=lista.map(p=>`<li>${p}</li>`).join("");

        dibujar(intervalos,criticos);

        const item=document.createElement("li");
        item.textContent=`${descripcion} → ${solucion}`;
        document.getElementById("historial").prepend(item);

    } catch(error) {
        resultado.textContent=error.message;
        pasos.innerHTML="<li>No se pudo completar la operación.</li>";
    }
}

function dibujar(intervalos, puntos) {
    const canvas=document.getElementById("grafica");
    const ctx=canvas.getContext("2d");

    ctx.clearRect(0,0,canvas.width,canvas.height);

    const finitos=puntos.filter(Number.isFinite);
    let min=Math.min(-5,...finitos)-2;
    let max=Math.max(5,...finitos)+2;

    const X=x=>30+(x-min)/(max-min)*640;
    const y=55;

    ctx.strokeStyle="#64748b";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(20,y);
    ctx.lineTo(680,y);
    ctx.stroke();

    ctx.fillStyle="#64748b";
    ctx.font="12px Arial";

    for(let x=Math.ceil(min);x<=Math.floor(max);x++) {
        ctx.beginPath();
        ctx.moveTo(X(x),y-5);
        ctx.lineTo(X(x),y+5);
        ctx.stroke();
        ctx.fillText(x,X(x)-4,y+25);
    }

    ctx.lineWidth=5;
    ctx.strokeStyle="#315efb";
    ctx.fillStyle="#315efb";

    intervalos.forEach(v=>{
        const izq=v.izq===-Infinity?20:X(v.izq);
        const der=v.der===Infinity?680:X(v.der);

        if(v.izq===v.der) {
            ctx.beginPath();
            ctx.arc(X(v.izq),y,6,0,Math.PI*2);
            ctx.fill();
            return;
        }

        ctx.beginPath();
        ctx.moveTo(izq,y);
        ctx.lineTo(der,y);
        ctx.stroke();

        [[izq,v.cerradoIzq],[der,v.cerradoDer]].forEach(([x,c])=>{
            if(x===20 || x===680) return;

            ctx.beginPath();
            ctx.arc(x,y,6,0,Math.PI*2);

            if(c) {
                ctx.fill();
            } else {
                ctx.fillStyle="white";
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle="#315efb";
            }
        });
    });
}

document.getElementById("resolver").addEventListener("click",resolver);

document.getElementById("limpiar").addEventListener("click",()=>{
    document.getElementById("historial").innerHTML="";
});

