var app = angular.module('app', []);

app.directive('loading', ['$http', function ($http) 
{
	var html = '<div class="progress transparent" style="margin-top: 0px;" ng-cloak><div class="indeterminate blue"></div></div>';
	return {
		restrict: 'E',
		replace: true,
		template: html,
		link: function (scope, element, attrs) 
		{      
			scope.isLoading = function () {return $http.pendingRequests.length > 0;};       
			scope.$watch(scope.isLoading, function (value) {value ? element.removeClass('ng-hide') : element.addClass('ng-hide')});
		}
	};
}]);

app.controller('main', ($scope, $http,  $window) =>
{
	$scope.tipos = [
	{
		key: 'cr',
		val: 'Retenciones'
	},{
		key: 'fv',
		val: 'Facturas'
	},{
		key: 'nc',
		val: 'Nota de Crédito'
	},{
		key: 'nd',
		val: 'Nota de Débito'
	},{
		key: 'gr',
		val: 'Guía de Remisión'
	},{
		key: 'lc',
		val: 'Liquidación de Compra'
	}]	
	$scope.datum = {
		start: new Date(),
		end: new Date(), 
		empresa: [], 
		destinatarios: '', 
		current: '', 
		all: true, 
		cedula_ruc: '', 
		val: false, 
		fecha_autorizacion: true,
		tipo: [
		{
			key: 'cr',
			val: 'Retenciones'
		},{
			key: 'fv',
			val: 'Facturas'
		},{
			key: 'nc',
			val: 'Nota de Crédito'
		},{
			key: 'nd',
			val: 'Nota de Débito'
		},{
			key: 'gr',
			val: 'Guía de Remisión'
		},{
			key: 'lc',
			val: 'Liquidación de Compra'
		}],

	}
	$http.get('/api/params/empresas').success(async res => {
		var rucs = []
		$scope.empresas = res;

		var publicip = '';
		$scope.datum.isPublic = false;
		res.forEach(i=>{
			publicip = i.publicip;
			$scope.datum.empresa.push(i)
			if (rucs.indexOf(i.ruc) == -1)
				rucs.push(i.ruc)
		})


		if (window.location.href.indexOf(publicip) >= 0){
			$scope.datum.isPublic = true;
			$scope.datum.all = false;
			setTimeout(()=>{
				document.getElementById('identificacion').focus()
				document.getElementById('identificacion').select()
			},100)
		}
		setTimeout(() => {
	    	$('select').material_select();
	    }, 200);
		await asyncForEach(rucs, (async i => {
			let res = await $http.get('/api/firma/fecha_caducidad/'+i)
			if (res.status == 200){
				if (parseInt(res.data) < $scope.empresas[getIndex($scope.empresas, 'ruc', i)].avisar_desde_dia && parseInt(res.data) > -1)
					Materialize.toast('La firma de '+$scope.empresas[getIndex($scope.empresas, 'ruc', i)].empresa + ' caducará en ' + res.data + ' días', 3000, 'orange')
				else if (parseInt(res.data) < 0)
					Materialize.toast('La firma de '+$scope.empresas[getIndex($scope.empresas, 'ruc', i)].empresa + ' caducó hace ' + (res.data * -1) + ' días', 3000, 'red')
			}
		}))
	    
	})
	.error(() => {
		Materialize.toast('Error de conexión', 1000, 'red')
	})

	$scope.$watch('datum.all', (n,o) => {
		if (n===o) return;
		if (!n){
			setTimeout(()=>{
				document.getElementById('identificacion').focus()
				document.getElementById('identificacion').select()
			},100)
			
		}

	},true)

	xmlToJson = e => {
        var t = {};
        if (1 == e.nodeType) {
            if (e.attributes.length > 0) {
                t["@attributes"] = {};
                for (var o = 0; o < e.attributes.length; o++) {
                    var i = e.attributes.item(o);
                    t["@attributes"][i.nodeName] = i.nodeValue
                }
            }
        } else 3 == e.nodeType && (t = e.nodeValue);
        if (e.hasChildNodes())
            for (var s = 0; s < e.childNodes.length; s++) {
                var a = e.childNodes.item(s),
                    n = a.nodeName;
                if (void 0 === t[n]) t[n] = xmlToJson(a);
                else {
                    if (void 0 === t[n].push) {
                        var r = t[n];
                        t[n] = [], t[n].push(r)
                    }
                    t[n].push(xmlToJson(a))
                }
            }
        return t
    }

	$scope.convert_date = date => {
		return moment(date, 'YYYY-MM-DDTHH:mm:ss').format('DD/MM/YYYY')
	}



	$scope.get = async() =>{

		if (!$scope.datum.all && $scope.datum.cedula_ruc == ''){
			Materialize.toast('Escriba una cédula válida por favor', 3000, 'orange')
			document.getElementById('identificacion').focus()
			return;
		}
		var estacion= ','
		var punto = ','
		var empresas = ','
        $scope.datum.empresa.forEach(i=>{
            empresas+=i.ruc+','
	    	estacion+= i.estacion + (i.estacion == '' ? '' : ',')
	    	punto+= i.punto + (i.punto == '' ? '' : ',')
        })

        var tipos = ','
        $scope.datum.tipo.forEach(i=>{
            tipos+=i.key+','
        })
		
        var databases = [];
        $scope.datum.empresa.forEach(i => {
		
        	var isThere = false;
        	for(var j=0; j< databases.length; j++){
        		if (i.db == databases[j].db && i.host == databases[j].host){
        			isThere = true;
        			break;
        		}
        	}
        	if (!isThere) databases.push(i);
        })



	

        $scope.data = [];
        var url = $scope.datum.all ?  '/api/documentoLike/'+document.getElementById('start').value+'&'+document.getElementById('end').value+'&'  : '/api/documento/'+$scope.datum.cedula_ruc+'&'+document.getElementById('start').value+'&'+document.getElementById('end').value+'&';
        databases.forEach(async i => {
			$http.post(url+i.db, {empresas,estacion,punto, tipos, params:{fecha_autorizacion: $scope.datum.fecha_autorizacion}})
			.success(res => {
				$scope.total = 0;
				if(res.length > 0){
					res.forEach(j => {
						$scope.total+= parseFloat(j.val);
						j.origin = i.db;
						$scope.data.push(j);
					})	

				}


			}) 
			.error(() => {
				Materialize.toast('Error de conexión', 1000, 'red')
			})      	
        })
	}

	$scope.downloadXML = i => {
		var xml = $scope.data[i].xml_autorizado;

		var pom = document.createElement('a');
		var filename = $scope.data[i].clave_acceso+".xml";
		var bb = new Blob([xml], {type: 'text/plain'});
		pom.setAttribute('href', window.URL.createObjectURL(bb));
		pom.setAttribute('download', filename);
		pom.dataset.downloadurl = ['text/plain', pom.download, pom.href].join(':');
		pom.draggable = true; 
		pom.classList.add('dragout');
		pom.click();
	}

	$scope.downloadPDF = i => {
		var xml = $scope.data[i].ce_xml;
        switch($scope.data[i].tipo_comprobante){
        	case 'FV': tipo = 'factura'; break;
        	case 'CR': tipo = 'retencion'; break;
        	case 'NC': tipo = 'credito'; break;
        	case 'ND': tipo = 'debito'; break;
        	case 'GR': tipo = 'remision'; break;
        	case 'LC': tipo = 'liquidacion'; break;
        }

        var xml = $scope.data[i].ce_xml;
		xml = xml.replace(/\0/g, '')
		var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(xml,"text/xml");
        var json = xmlToJson(xmlDoc)
		
		if (tipo == 'retencion')
			if (parseFloat(json.comprobanteRetencion['@attributes'].version) >= 2)
				tipo = 'retencion2'		

		$http.post('api/documento/ride/'+tipo+'/'+$scope.data[i].fecha_autorizacion, {xml})
		.success(res => {
			setTimeout(()=>{
				window.open(escape('/api/pdf/'+res));
			},1000)
	        
		})
		.error(err => {
			Materialize.toast('Error de conexión', 1000, 'red')
		})
	}

	$scope.mail = () => {
		var i = $scope.datum.current;
		var database = $scope.empresas.find(j=>j.ruc == $scope.data[i].ruc_emisor);
		if (database.mailsDefault.manual)
			var destinatarios = $scope.datum.destinatarios.concat(','+database.mailsDefault.mail);
		else
			var destinatarios = $scope.datum.destinatarios;
		
		$http.get('api/mail/'+$scope.data[i].origin+'/'+$scope.data[i].ce_id+'/'+destinatarios)
		.success(res => {
	       Materialize.toast('Correo enviado', 1000, 'green')
		})
		.error(err => {
			Materialize.toast('Error de conexión', 1000, 'red')
		})
	}		

	$scope.select = i => {
		$scope.datum.destinatarios=''
		var tipo = '';
		switch($scope.data[i].tipo_comprobante){
        	case 'FV': tipo = 'factura'; break;
        	case 'CR': tipo = 'comprobanteRetencion'; break;
        	case 'NC': tipo = 'notaCredito'; break;
        	case 'ND': tipo = 'notaDebito'; break;
        	case 'GR': tipo = 'guiaRemision'; break;
        	case 'LC': tipo = 'liquidacionCompra'; break;
        }
		$scope.datum.current = i;
		var xml = $scope.data[i].ce_xml;
		xml = xml.replace(/\0/g, '')
		var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(xml,"text/xml");
        var json = xmlToJson(xmlDoc)
        if (json[tipo].infoAdicional)
        	if (!json[tipo].infoAdicional.campoAdicional.length){
        		if (json[tipo].infoAdicional.campoAdicional["@attributes"].nombre == 'Email')
        			$scope.datum.destinatarios += json[tipo].infoAdicional.campoAdicional["#text"] 
        	}
        	else {
        		json[tipo].infoAdicional.campoAdicional.forEach(i => {
        			if (i["@attributes"].nombre == 'Email')
        				$scope.datum.destinatarios += i["#text"] 
        		})
        	}
	}
});

app.controller('config', ($scope, $http,  $window) =>
{
	$scope.data = []
	openModal('login')

	$scope.login = () => {
		$http.get('/api/params/login/'+$scope.datum.key).success(res => {
			if (res.length == 0){
				openModal('login')
				Materialize.toast('Key incorrecta', 1000, 'red')
				$scope.datum.key = '';
				
			}
			else{
				$scope.data = res;
				closeModal('login')
			}
		})
		.error(() => {
			openModal('login')
			Materialize.toast('Error de conexión', 1000, 'red')
		})
	}

	$scope.add = () =>{
		$scope.data.databases.push($scope.data.databases[$scope.data.databases.length-1])
	}
	
});