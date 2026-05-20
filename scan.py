import os
import cv2
import pytesseract
import subprocess
import paddle
from paddleocr import PaddleOCR


def deskew(image):

    co_ords = np.column_stack(np.where(image > 0))

    angle = cv2.minAreaRect(co_ords)[-1]

    if angle < -45:

        angle = -(90 + angle)

    else:

        angle = -angle

    (h, w) = image.shape[:2]

    center = (w // 2, h // 2)

    M = cv2.getRotationMatrix2D(center, angle, 1.0)

    rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC,

        borderMode=cv2.BORDER_REPLICATE
    )

    return rotated














def main():


   
    files = os.listdir("./images")
    this_file = os.path.abspath(os.path.join("./images",files[1]))
    print(this_file)
    #img = cv2.imread(this_file)

    ocr = PaddleOCR(
    use_doc_orientation_classify=True,
    use_doc_unwarping=False,
    use_textline_orientation=True,
    lang='en',

    )

    result = ocr.predict("./receipt3.jpeg")

    # for page in result:
    #     for line in page["rec_texts"]:
    #         print(line)

    with open("paddleTest.txt","w") as f:
        for page in result:
            for line in page["rec_texts"]:
                f.write(line + "\n")

    
   


main()
