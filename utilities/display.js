function printNumberMatrix(matrix) {
    d3.select('.matrix').select('table').remove();
    let table = d3.select('.matrix').append('table').attr('class', 'pure-table pure-table-bordered'),
        thead = table.append('thead'),
        tbody = table.append('tbody'),
        columns = d3.range(1, matrix.length + 1);

    // append the header row
    thead.append('tr')
        .selectAll('th')
        .data(columns)
        .enter()
        .append('th')
        .text(function (column) {
            return column;
        });

    // create a row for each object in the data
    var rows = tbody.selectAll('tr')
        .data(matrix)
        .enter()
        .append('tr');

    // create a cell in each row for each column
    var cells = rows.selectAll('td')
        .data(function (row) {
            return columns.map(function (column) {
                return {
                    column: column,
                    h: (row[column - 1]) ? row[column - 1][0] : false,
                    p: (row[column - 1]) ? row[column - 1][1] : false
                };
            });
        })
        .enter()
        .append('td')
        .html(function (d) {
            return (!!d.h) ? d.h.toFixed(2) + ((!!d.p) ? ' - ' + d.p.toFixed(2) : '') : 'X';
        });
}