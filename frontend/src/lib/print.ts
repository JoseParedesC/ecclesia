/** Imprime con un título de documento descriptivo (también es el nombre sugerido al "Guardar como PDF"). */
export function printReport(title: string) {
  const previous = document.title;
  const restore = () => { document.title = previous; window.removeEventListener("afterprint", restore); };
  document.title = title;
  window.addEventListener("afterprint", restore);
  window.print();
}
