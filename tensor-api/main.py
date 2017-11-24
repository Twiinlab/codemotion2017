# [START app]
import logging
from flask import Flask, request, json, Response
from flask_cors import CORS, cross_origin

# TensorFlow Dependencias
import os
import urllib
import tensorflow as tf
import numpy as np
from skimage import io
from skimage import transform as tform
from skimage.color import rgb2gray, rgb2grey, rgba2rgb
from PIL import Image
import base64
import re
from io import BytesIO

app = Flask(__name__)
CORS(app)

# ## Init variables
savefile = "./STORED_model/my_trained_model.json"
# classList = ['duck','smile','car','pencil','star','burger','cookie','rabbit','moon','icecream']
classList = ['smile','car','pencil','burger','moon','hand','tornado','scissors','mug','sock']


# ### Helper Functions
def init_weights(shape):
    init_random_dist = tf.truncated_normal(shape, stddev=0.1)
    return tf.Variable(init_random_dist)

def init_bias(shape):
    init_bias_vals = tf.constant(0.1, shape=shape)
    return tf.Variable(init_bias_vals)

def conv2d(x, W):
    return tf.nn.conv2d(x, W, strides=[1, 1, 1, 1], padding='SAME')

def max_pool_2by2(x):
    return tf.nn.max_pool(x, ksize=[1, 2, 2, 1],
                          strides=[1, 2, 2, 1], padding='SAME')

def convolutional_layer(input_x, shape):
    W = init_weights(shape)
    b = init_bias([shape[3]])
    return tf.nn.relu(conv2d(input_x, W) + b)

def normal_full_layer(input_layer, size):
    input_size = int(input_layer.get_shape()[1])
    W = init_weights([input_size, size])
    b = init_bias([size])
    return tf.matmul(input_layer, W) + b

def one_hot_encode(pos):
    out = np.zeros(10)
    out[pos] = 1
    return out

# Placeholders
x = tf.placeholder(tf.float32,shape=[None,784])
y_true = tf.placeholder(tf.float32,shape=[None,10])

# Layers
x_image = tf.reshape(x,[-1,28,28,1])

convo_1 = convolutional_layer(x_image,shape=[6,6,1,32])
convo_1_pooling = max_pool_2by2(convo_1)

convo_2 = convolutional_layer(convo_1_pooling,shape=[6,6,32,64])
convo_2_pooling = max_pool_2by2(convo_2)

convo_2_flat = tf.reshape(convo_2_pooling,[-1,7*7*64])
full_layer_one = tf.nn.relu(normal_full_layer(convo_2_flat,1024))

hold_prob = tf.placeholder(tf.float32)
full_one_dropout = tf.nn.dropout(full_layer_one,keep_prob=hold_prob)

y_pred = normal_full_layer(full_one_dropout,10)

# Loss Function
cross_entropy = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(labels=y_true,logits=y_pred))

# Optimizer
optimizer = tf.train.AdamOptimizer(learning_rate=0.0001) # 0.0001
train = optimizer.minimize(cross_entropy)

# Initialize Variables
# init = tf.global_variables_initializer()
# saver = tf.train.Saver()

### Session
sess = tf.InteractiveSession()
sess.run(tf.global_variables_initializer())
saver = tf.train.Saver()
saver.restore(sess, "./STORED_model/my_trained_model.json")

# Helpers
def readGrayImageFromData(data):
    imageToPredict = rgba2rgb(data)
    return rgb2grey(imageToPredict)

def readGrayImageFromUrl(url):
    imageToPredict = rgba2rgb(io.imread(url))
    return rgb2grey(imageToPredict)

def simplifyImage(originalImage):
    partialResizeImage = tform.resize(originalImage, (28, 28), order=5)
    return (1 - np.reshape(partialResizeImage,newshape=(1,784)))

def predictFromDataImage(data):
    imageData = readGrayImageFromData(data)
    imageSimple = simplifyImage(imageData)
    feed_dict = {x: imageSimple, y_true: np.zeros((1, 10)), hold_prob : 0.5 }
    probs = sess.run(tf.nn.softmax(y_pred), feed_dict)

    # feed_dict = {x: imageSimple, y_true: np.zeros((1, 10)), hold_prob : 0.5 }
    # classification = sess.run(tf.argmax(y_pred,1), feed_dict)
    return probs[0]

def predictFromUrlImage(imageUrl):
    imageData = readGrayImageFromUrl(imageUrl)
    imageSimple = simplifyImage(imageData)
    feed_dict = {x: imageSimple, y_true: np.zeros((1, 10)), hold_prob : 0.5 }
    classification = sess.run(tf.argmax(y_pred,1), feed_dict)  
    return classification

@app.route('/foo', methods=['POST','OPTIONS'])
def foo():
    return 'hello foo'

@app.route('/hello', methods=['GET'])
def hello_world():
    return 'Hello, World!'

@app.route('/predict', methods=['POST'])
def get_image():
    image_b64 = request.values['imageBase64']
    image_data = re.sub('^data:image/.+;base64,', '', image_b64)
    image_PIL = Image.open(BytesIO(base64.b64decode(image_data)))
    image_np = np.array(image_PIL)
    myPrediction = predictFromDataImage(image_np)
    result = { 'prediction': np.array(myPrediction).tolist()}
    return Response(json.dumps(result), mimetype='application/json')


if __name__ == '__main__':
    # This is used when running locally. Gunicorn is used to run the
    # application on Google App Engine. See entrypoint in app.yaml.
    app.run(host='127.0.0.1', port=8080, debug=True)
# [END app]


