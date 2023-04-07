import {
	useEffect,
	useRef, useImperativeHandle,
	forwardRef
} from "react";

export const Sequence = forwardRef((props, ref) => {
	const {nsemi, width, height, division, nbars, ppqn, chId, mStart} = props;
	const canvasRef = useRef();
	const barInc = width / nbars;
	const semiHeight = height / nsemi;
	useEffect(() => {
		if (!canvasRef.current)
			return;

		const semiHeight = height / nsemi;
		const ctx = canvasRef.current.getContext("2d");
		ctx.transform(1, 0, 0, -1, 0, height);
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = "rgba(0, 0, 0, 0)";

		ctx.fillRect(0, 0, width, height);
		for (let i = 0;i < nbars;i++) {
			ctx.beginPath();
			if (i % division === 0) {
				ctx.strokeStyle = "white";
			} else {
				ctx.strokeStyle = "grey";
			}
			ctx.moveTo(i * barInc, 0);
			ctx.lineTo(i * barInc, height);
			ctx.stroke();
		}
		for (let i = nsemi;i >= 0;i--) {
			if ([1, 3, 5, 8, 10].indexOf(i % 12) > -1) {
				ctx.fillStyle = "rgba(22, 22, 22, 0.5)";
			} else {
				ctx.fillStyle = "rgba(33, 33, 33, 0.5)";
			}
			ctx.fillRect(0, i * semiHeight, width, semiHeight);
			ctx.beginPath();
			ctx.strokeStyle = "rgba(1, 1, 1, 0.5)";
			ctx.moveTo(0, i * semiHeight);
			ctx.lineTo(width, i * semiHeight);
			ctx.stroke();
		}
	}, [width, height, division, nbars, nsemi, barInc]);

	useImperativeHandle(
		ref,
		() => {
			return {
				drawBarN(t1, t2, midi) {
					let d = midi - mStart;
					while (d > 24) {
						d--;
						//canvasRef.current.canvas.style.translateY(-2):
					}
					const ctx = canvasRef.current.getContext("2d");
					ctx.save();
					ctx.fillStyle = `rgb(${midi * 2},${(127 - midi) * 2},0)`;
					ctx.fillRect(
						t1 / ppqn * barInc - 1,
						d * semiHeight - 1,
						barInc * (t2 - t1) / ppqn,
						semiHeight
					);
					ctx.restore();
				},
				drawBar(qn, midi) {
					this.drawBarN(qn * ppqn, (qn + 1) / ppqn, midi);
				},
			};
		},
		[barInc, mStart, semiHeight]
	);

	return <canvas ref={canvasRef} width={width} height={height}></canvas>;
});
