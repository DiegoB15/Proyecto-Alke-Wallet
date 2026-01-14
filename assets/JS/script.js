
$(document).ready(function () {
    // --- LÓGICA GENERAL ---

    // Formato de moneda para Chile
    const formatter = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
    });

    // Función para obtener saldo actual o inicializarlo si no existe
    function obtenerSaldo() {
        return Number(localStorage.getItem("saldo")) || 1000000;
    }

    // Función para guardar saldo
    function guardarSaldo(nuevoSaldo) {
        localStorage.setItem("saldo", nuevoSaldo);
    }

    // Función para registrar una transacción en el historial
    function registrarTransaccion(tipo, descripcion, monto) {
        let historial = JSON.parse(localStorage.getItem("historial")) || [];
        const nuevaTransaccion = {
            tipo: tipo, // 'ingreso' o 'egresos'
            descripcion: descripcion,
            monto: monto,
            fecha: new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
        };
        historial.unshift(nuevaTransaccion); // Agregar al principio
        localStorage.setItem("historial", JSON.stringify(historial));
    }

    // Cargar saldo al iniciar
    let saldo = obtenerSaldo();

    // Actualizar visualización del saldo en cualquier página que tenga el elemento #saldo
    if ($('#saldo').length) {
        $('#saldo').text(formatter.format(saldo)).hide().fadeIn(1000);
    }

    // --- 1. PÁGINA LOGIN.HTML ---
    $('#loginBtn').click(function () {
        const correo = $('#correo').val();
        const clave = $('#clave').val();
        const $error = $('#error');

        $error.hide().text("");

        if (correo === "" || clave === "") {
            $error.text("⚠️ Complete todos los campos.").fadeIn();
            return;
        }

        if (correo === "hola@gmail.com" && clave === "1234") {
            $(this).removeClass('btn-primary').addClass('btn-success').text('¡Bienvenido!');
            setTimeout(function () {
                window.location.href = "menu.html";
            }, 800);
        } else {
            $error.text("❌ Correo o clave incorrectos.").fadeIn();
            $('.card').addClass('shake');
            setTimeout(() => $('.card').removeClass('shake'), 500);
        }
    });

    // --- 2. PÁGINA DEPOSIT.HTML---
    if ($('#saldoActual').length) {
        $('#saldoActual').text(formatter.format(saldo));
    }

    $('#depositForm').submit(function (e) {
        e.preventDefault();

        const monto = Number($('#depositAmount').val());
        const $mensaje = $('#mensaje');

        $mensaje.hide().removeClass('text-danger text-success alert alert-success alert-danger');

        if (monto <= 0 || isNaN(monto)) {
            $mensaje.text("❌ Ingrese un monto válido mayor a 0").addClass('alert alert-danger').slideDown();
            return;
        }

        // Actualizar saldo
        saldo += monto;
        guardarSaldo(saldo);
        registrarTransaccion('ingreso', 'Depósito en Efectivo', monto);

        // Feedback visual
        $('#saldoActual').text(formatter.format(saldo)).css('color', '#198754');

        // MENSAJE SOLICITADO: "Depósito realizado correctamente"
        $mensaje.text(`✅ Depósito realizado correctamente. Nuevo saldo: ${formatter.format(saldo)}`)
            .addClass('alert alert-success').fadeIn();

        $('#depositAmount').val("");
    });


    // --- 3. PÁGINA SENDMONEY.HTML ---

    // Lista de contactos (Simulada para autocompletar)
    const contactos = ["Daniel Frahn", "Sence"];

    // Autocompletar en búsqueda de contactos
    $("#buscarContacto").on("input", function () {
        const valor = $(this).val().toLowerCase();
        $(".list-group-item").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(valor) > -1)
        });
    });

    // Abrir modal de transferencia al hacer clic en "Enviar"
    $(document).on('click', '.btn-enviar-dinero', function () {
        const nombreDestino = $(this).closest('li').find('h6').text();
        $('#destinatarioNombre').val(nombreDestino);
        $('#montoTransferencia').val('');
        $('#modalTransferencia').modal('show');
    });

    // Procesar la Transferencia
    $('#formTransferencia').submit(function (e) {
        e.preventDefault();

        const monto = Number($('#montoTransferencia').val());
        const destinatario = $('#destinatarioNombre').val();
        const $msgTransferencia = $('#mensajeTransferencia');

        if (monto <= 0 || isNaN(monto)) {
            $msgTransferencia.text("❌ El monto debe ser mayor a 0").removeClass('d-none text-success').addClass('text-danger');
            return;
        }

        if (monto > saldo) {
            $msgTransferencia.text("❌ Saldo insuficiente").removeClass('d-none text-success').addClass('text-danger');
            return;
        }

        // Realizar la transferencia
        saldo -= monto;
        guardarSaldo(saldo);
        registrarTransaccion('egreso', `Transferencia a ${destinatario}`, monto);

        // Éxito
        $msgTransferencia.text(`✅ Transferencia exitosa a ${destinatario}. Nuevo saldo: ${formatter.format(saldo)}`)
            .removeClass('d-none text-danger').addClass('text-success');

        // Cerrar modal después de 1.5 segundos y recargar visualmente si es necesario
        setTimeout(() => {
            $('#modalTransferencia').modal('hide');
            $msgTransferencia.addClass('d-none');
        }, 2000);
    });

    
    $('#btnAgregar').click(function () {
        $('#errorModal').text('');
        $('#modalContacto').modal('show');
    });

    $('#guardarContacto').click(function () {
        const nombre = $('#nombre').val().trim();
        const rut = $('#rut').val().trim();
        const alias = $('#alias').val().trim();
        const banco = $('#banco').val().trim();
        const $errorModal = $('#errorModal');

        if (!nombre || !rut || !alias || !banco) {
            $errorModal.text("⚠️ Complete todos los campos").fadeIn();
            return;
        }

        // Crear elemento HTML del nuevo contacto
        const nuevoContacto = `
            <li class="list-group-item d-flex justify-content-between align-items-center nuevo-contacto" style="display:none;">
                <div>
                    <h6 class="mb-0 fw-bold">${nombre}</h6>
                    <small class="text-muted">RUT: ${rut} · ${banco}</small>
                </div>
                <button class="btn btn-sm btn-outline-primary btn-enviar-dinero">Enviar</button>
            </li>
        `;

        $('#listaContactos').append(nuevoContacto);
        $('.nuevo-contacto').last().slideDown(); 

        // Cerrar modal y limpiar campos
        $('#modalContacto').modal('hide');
        $('#modalContacto form')[0]?.reset(); 
        $('#nombre, #rut, #alias, #banco').val('');
    });

    // Evento delegado para botones creados dinámicamente
    $(document).on('click', '.btn-enviar-dinero', function () {
        const nombreDestino = $(this).closest('li').find('h6').text();
        alert(`Dinero enviado a ${nombreDestino} (Simulación)`);
    });

     // --- 4. PÁGINA TRANSACTION.HTML ---
    
    if (window.location.pathname.includes("transaction.html")) {
        const historial = JSON.parse(localStorage.getItem("historial")) || [];
        let totalIng = 0;
        let totalEgr = 0;
        const $listaMovimientos = $('.list-group.shadow-sm'); 

        // 1. PRIMERO: Sumar los montos de la lista ESTÁTICA (la que está en el HTML)
        // Recorremos los elementos que ya existen en el HTML para sumarlos al total
        $('.movimiento').each(function() {
            const montoStatic = Number($(this).data('monto'));
            if (montoStatic > 0) totalIng += montoStatic;
            else totalEgr += Math.abs(montoStatic);
        });

        // 2. SEGUNDO: Procesar y agregar la lista DINÁMICA (LocalStorage)
        // NO usamos .empty() para no borrar lo estático
        
        if (historial.length > 0) {
            let htmlDinamico = ""; 

            historial.forEach(mov => {
                // Calcular totales de los nuevos movimientos
                if (mov.tipo === 'ingreso') totalIng += mov.monto;
                else totalEgr += mov.monto;

                // Crear HTML del movimiento
                const signo = mov.tipo === 'ingreso' ? '+' : '-';
                const claseColor = mov.tipo === 'ingreso' ? 'text-ingreso' : 'text-egreso';
                
                // Construimos el elemento
                htmlDinamico += `
                    <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center movimiento ${mov.tipo}" data-desc="${mov.descripcion}" data-monto="${signo}${formatter.format(mov.monto)}">
                        <div>
                            <span class="fw-bold desc">${mov.descripcion}</span>
                            <br><small class="text-muted">${mov.fecha}</small>
                        </div>
                        <span class="${claseColor}">${signo}${formatter.format(mov.monto)}</span>
                    </div>
                `;
            });

            
            $listaMovimientos.prepend(htmlDinamico);
        }

        // 3. Actualizar cuadros de resumen (Total Ingresos / Egresos)
        $('#totalIngresos').text(formatter.format(totalIng));
        $('#totalEgresos').text(formatter.format(totalEgr));

        // --- Lógica de filtrado y visualización de detalles (se mantiene igual) ---
        
        // Lógica de filtrado de botones
        $('.btn-group button').click(function () {
            const filtro = $(this).text().toLowerCase();
            $('.btn-group button').removeClass('active');
            $(this).addClass('active');

            $('.movimiento').hide();
            if (filtro === 'todos') $('.movimiento').fadeIn();
            else if (filtro === 'ingresos') $('.movimiento.ingreso').fadeIn();
            else if (filtro === 'egresos') $('.movimiento.egreso').fadeIn();
        });

        // Ver detalle al hacer clic
        $(document).on('click', '.movimiento', function () {
            $('.movimiento').removeClass('active border border-2 border-primary');
            $(this).addClass('active border border-2 border-primary');
            
            // Intentamos obtener data del HTML, si es dinámico o estático
            let desc = $(this).data('desc');
            let monto = $(this).data('monto');
            
            // Si es un elemento estático (del HTML original), a veces no tiene data-desc, lo buscamos en el texto
            if (!desc) {
                desc = $(this).find('.desc').text();
            }
            // Si el monto viene como número puro del data-monto estático (ej: 50000), lo formateamos
            if (!isNaN(monto)) {
                monto = formatter.format(monto);
            }

            $('#detalle').hide().html(`
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h5>Detalle de Transacción</h5>
                        <p><strong>Concepto:</strong> ${desc}</p>
                        <p><strong>Monto:</strong> ${monto}</p>
                        <p class="text-muted">Estado: Completado exitosamente</p>
                    </div>
                </div>
            `).slideDown();
        });
    }

    // Botones de navegación generales
    $('#btnDepositar, #btnEnviar, #btnMovimientos').click(function () {
        const id = $(this).attr('id');
        let destino = '';
        if (id === 'btnDepositar') destino = 'deposit.html';
        if (id === 'btnEnviar') destino = 'sendmoney.html';
        if (id === 'btnMovimientos') destino = 'transaction.html';

        window.location.href = destino;
    });
});
