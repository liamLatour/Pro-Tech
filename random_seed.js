class Random {
    constructor(seed="") {
        this.weak_seed = seed;
        if (seed == "") {
            this.weak_seed = Math.random().toString().substring(2);
        }
        this.seed = this.cyrb128(this.weak_seed);
        this.rand_gen = this.sfc32(this.seed[0], this.seed[1], this.seed[2], this.seed[3]);
        this.rand_gen();
    }

    cyrb128(str) {
        let h1 = 1779033703,
            h2 = 3144134277,
            h3 = 1013904242,
            h4 = 2773480762;
        for (let i = 0, k; i < str.length; i++) {
            k = str.charCodeAt(i);
            h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
            h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
            h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
            h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
        }
        h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
        h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
        h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
        h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
        return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
    }

    sfc32(a, b, c, d) {
        return function () {
            a >>>= 0;
            b >>>= 0;
            c >>>= 0;
            d >>>= 0;
            let t = (a + b) | 0;
            a = b ^ b >>> 9;
            b = c + (c << 3) | 0;
            c = (c << 21 | c >>> 11);
            d = d + 1 | 0;
            t = t + d | 0;
            c = c + t | 0;
            return (t >>> 0) / 4294967296;
        }
    }

    rand_weight() {
        return Math.round(this.rand_gen() * 40) + 1;
    }

    normalize_coefs(coefs){
        let sum_coefs = coefs.reduce((partialSum, a) => partialSum + a, 0);

        return coefs.map(x => x/sum_coefs);
    }

    rand_in_array(array, coefs=0) {
        if(coefs!=0){
            let current = 0;
            let rand = this.rand_gen();
            coefs = this.normalize_coefs(coefs);

            for(let i=0; i<array.length; i++){
                current += coefs[i];
                if(current >= rand){
                    return array[i];
                }
            }
        }
        return array[Math.round(this.rand_gen() * (array.length - 1))];
    }
}

let random = new Random();
document.getElementById("seed").innerHTML = random.weak_seed;

$('#form').submit(function () {
    let seed = $('#seed_input').val();
    random = new Random(seed);

    document.getElementById("seed").innerHTML = random.weak_seed;
});