CREATE  FUNCTION web_clear_special (  @str LONG VARCHAR )
RETURNS LONG VARCHAR
BEGIN
    SET @str = REPLACE(@str, 'Ñ', 'N');
    SET @str = REPLACE(@str, 'Á', 'A');
    SET @str = REPLACE(@str, 'É', 'E');
    SET @str = REPLACE(@str, 'Í', 'I');
    SET @str = REPLACE(@str, 'Ó', 'O');
    SET @str = REPLACE(@str, 'Ú', 'U');
    RETURN (@str)
END;

ALTER TABLE in_cabecera_xml_temp ADD descuento_adicional NUMERIC (20,6);
ALTER TABLE in_movimiento_xml_temp ADD detadicional LONG VARCHAR;